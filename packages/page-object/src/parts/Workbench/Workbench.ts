import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Electron from '../Electron/Electron.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export interface ISimplifedWindow {
  readonly close: () => Promise<void>
  readonly sessionRpc?: any
}

const createSessionRpcConnection = (rpc: any, sessionId: string) => {
  return {
    callbacks: rpc.callbacks,
    invoke(method: string, params?: unknown) {
      return rpc.invokeWithSession(sessionId, method, params)
    },
    listeners: rpc.listeners,
    on: rpc.on,
    once: rpc.once,
    sessionId,
  }
}

const rejectaftertimeout = () =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for new window')), 5000))

export const create = ({ browserRpc, electronApp, expect, page, platform, VError, ideVersion }: CreateParams) => {
  return {
    async waitForNewWindow() {
      const { promise, resolve } = Promise.withResolvers<{ sessionId?: string }>()
      let sessionId: string | undefined = undefined
      let targetCaptured = false

      // Set up listener for new target if browserRpc is available
      if (browserRpc) {
        const handleNewTarget = (message: any): void => {
          if (targetCaptured) {
            return
          }
          targetCaptured = true
          sessionId = message.params.sessionId as string
          resolve({ sessionId })
        }
        browserRpc.on('Target.attachedToTarget', handleNewTarget)
      }

      await promise

      return sessionId
    },
    async openNewWindow(): Promise<ISimplifedWindow> {
      try {
        const newWindowPromise = this.waitForNewWindow()
        // Run the quickpick command to open new window
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.NewWindow)

        // Wait for the new window and session to be ready
        let newWindowSessionRpc: any = undefined
        const sessionId = await Promise.race([newWindowPromise, rejectaftertimeout()])

        // Create sessionRpc connection if sessionId was captured
        if (sessionId) {
          newWindowSessionRpc = createSessionRpcConnection(browserRpc, sessionId)
        }

        await page.waitForIdle()

        // Return an object for manipulating the new window
        return {
          async close() {
            try {
              if (newWindowSessionRpc) {
                await newWindowSessionRpc.invoke('workbench.action.closeWindow')
              }
            } catch (error) {
              throw new VError(error, `Failed to close new window`)
            }
          },
          sessionRpc: newWindowSessionRpc,
        }
      } catch (error) {
        throw new VError(error, `Failed to open new window`)
      }
    },
    async focusLeftEditorGroup() {
      await page.waitForIdle()
      const quickPick = QuickPick.create({
        electronApp: undefined,
        expect,
        ideVersion: { major: 0, minor: 0, patch: 0 },
        page,
        platform,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.ViewFocusLeftEditorGroup)
      await page.waitForIdle()
    },
    async shouldBeVisible() {
      const workbench = page.locator('.monaco-workbench')
      await expect(workbench).toBeVisible()
    },
    async shouldHaveEditorBackground(color: string) {
      try {
        const workbench = page.locator('.monaco-workbench')
        await expect(workbench).toHaveCss('--vscode-editor-background', color, {
          timeout: 1000,
        })
      } catch (error) {
        throw new VError(error, `workbench has not the expected background color`)
      }
    },
  }
}
