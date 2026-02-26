import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const rejectaftertimeout = () => {
  const { promise, reject } = Promise.withResolvers<never>()
  setTimeout(() => reject(new Error('Timeout waiting for new window')), 5000)
  return promise
}

// @ts-ignore
export const create = ({ expect, page, platform, VError, electronApp, ideVersion, browserRpc, sessionRpc }: CreateParams) => {
  return {
    async waitForNewWindow() {
      const { promise, resolve } = Promise.withResolvers<string>()
      let targetCaptured = false

      // TODO cleanup listener

      if (!browserRpc) {
        throw new Error(`browser rpc is required`)
      }

      const handleNewTarget = (message: any): void => {
        if (targetCaptured) {
          return
        }
        targetCaptured = true
        const sessionId = message.params.sessionId as string
        resolve(sessionId)
      }
      browserRpc.on('Target.attachedToTarget', handleNewTarget)

      const sessionId = await promise

      return sessionId
    },
    async show() {
      try {
        const newWindowPromise = this.waitForNewWindow()
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
        const sessionId = await Promise.race([newWindowPromise, rejectaftertimeout()])

        await sessionRpc.invoke('Runtime.runIfWaitingForDebugger')

        await execPromise

        if (!sessionId) {
          throw new Error(`Failed to wait for window`)
        }

        const newWindowPage = await electronApp.waitForPage({
          injectUtilityScript: true,
          sessionId,
        })

        return {
          async close() {
            try {
              // await new Promise((r) => {
              //   setTimeout(r, 2000)
              // })
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
                stayVisible: false,
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
