import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

// @ts-ignore
export const create = ({ expect, page, platform, VError, electronApp, ideVersion, browserRpc, sessionRpc }: CreateParams) => {
  return {
    async waitForNewWindow({ timeout }: { timeout: number }) {
      const { promise, resolve } = Promise.withResolvers<string>()

      if (!browserRpc) {
        throw new Error(`browser rpc is required`)
      }

      const cleanup = (value: string) => {
        browserRpc.off('Target.attachedToTarget', handleNewTarget)
        clearTimeout(timeoutRef)
        resolve(value)
      }

      const handleTimeout = () => {
        cleanup('')
      }

      const handleNewTarget = (message: any): void => {
        const sessionId = message.params.sessionId as string
        cleanup(sessionId)
      }
      browserRpc.on('Target.attachedToTarget', handleNewTarget)
      const timeoutRef = setTimeout(handleTimeout, timeout)

      const sessionId = await promise

      return sessionId
    },
    async show() {
      try {
        const newWindowPromise = this.waitForNewWindow({ timeout: 10_000 })
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.showCommands({ pressKeyOnce: true })
        await quickPick.type(WellKnownCommands.OpenProcessExplorer)
        const selectPromise = quickPick.select(WellKnownCommands.OpenProcessExplorer, 'dont-care')
        const sessionId = await newWindowPromise

        if (!sessionId) {
          throw new Error(`Failed to wait for window`)
        }

        const newWindowPage = await electronApp.waitForPage({
          injectUtilityScript: true,
          sessionId,
        })

        // TODO need to wait for debugger to be paused?
        await page.waitForIdle()
        await newWindowPage.waitForIdle()

        await selectPromise

        return {
          async close() {
            try {
              // Wait for the window to be fully idle before attempting to close
              await newWindowPage.waitForIdle()
              await page.waitForIdle()
              const quickPick = QuickPick.create({
                electronApp,
                expect,
                ideVersion,
                page: newWindowPage,
                platform,
                VError,
              })
              // TODO this tries to avoid race condtion, but is ugly
              // for (let i = 0; i < 2; i++) {
              //   await quickPick.show()
              //   await quickPick.hide()
              // }
              await quickPick.showCommands({ pressKeyOnce: true })
              await quickPick.type(WellKnownCommands.CloseWindow)
              await page.waitForIdle()
              await newWindowPage.waitForIdle()
              await quickPick.pressEnter()
              await page.waitForIdle()
              // TODO wait for window to be closed
            } catch (error) {
              throw new VError(error, `Failed to hide process explorer`)
            }
          },
          locator: (selector: string) => newWindowPage.locator(selector),
          sessionRpc: newWindowPage.sessionRpc,
          waitForIdle: () => newWindowPage.waitForIdle(),
          async shouldBeVisible() {
            await newWindowPage.waitForIdle()
            const processExplorer = newWindowPage.locator('#process-explorer')
            await expect(processExplorer).toBeVisible({ timeout: 10_000 })
            await newWindowPage.waitForIdle()
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to show process explorer`)
      }
    },
  }
}
