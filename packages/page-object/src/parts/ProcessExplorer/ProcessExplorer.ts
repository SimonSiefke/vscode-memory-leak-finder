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
        console.log('attached to target', message)
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
        const execPromise = quickPick.executeCommand(WellKnownCommands.OpenProcessExplorer, {
          pressKeyOnce: true,
          stayVisible: false,
        })
        const sessionId = await newWindowPromise

        if (!sessionId) {
          throw new Error(`Failed to wait for window`)
        }

        const newWindowPagePromise = electronApp.waitForPage({
          injectUtilityScript: true,
          sessionId,
        })
        const newWindowPage = await newWindowPagePromise

        await sessionRpc.invoke('Runtime.runIfWaitingForDebugger')
        // await execPromise

        return {
          async close() {
            try {
              await new Promise((r) => {
                setTimeout(r, 2000)
              })
              // Wait for the window to be fully idle before attempting to close
              await newWindowPage.waitForIdle()
              const quickPick = QuickPick.create({
                electronApp,
                expect,
                ideVersion,
                page: newWindowPage,
                platform,
                VError,
              })
              await quickPick.executeCommand(WellKnownCommands.CloseWindow, {
                pressKeyOnce: true,
                stayVisible: 'dont-care',
              })
              await new Promise((r) => {
                setTimeout(r, 2000)
              })
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
