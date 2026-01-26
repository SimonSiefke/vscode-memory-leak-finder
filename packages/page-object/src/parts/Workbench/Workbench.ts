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

const rejectaftertimeout = () => {
  const { promise, reject } = Promise.withResolvers<never>()
  setTimeout(() => reject(new Error('Timeout waiting for new window')), 5000)
  return promise
}

const createPageFromSessionRpc = (sessionRpc: any) => {
  return {
    locator(selector: string, options?: any) {
      return sessionRpc.invoke('locator', { selector, ...options })
    },
    async waitForIdle() {
      return sessionRpc.invoke('waitForIdle')
    },
    sessionRpc,
  }
}

export const create = ({ browserRpc, electronApp, expect, page, platform, VError, ideVersion }: CreateParams) => {
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

        const sessionId = await Promise.race([newWindowPromise, rejectaftertimeout()])
        if (!sessionId) {
          throw new Error(`Failed to wait for window`)
        }
        const newWindowSessionRpc = createSessionRpcConnection(browserRpc, sessionId)
        const newWindowPage = createPageFromSessionRpc(newWindowSessionRpc)

        await page.waitForIdle()

        return {
          async close() {
            try {
              const quickPick = QuickPick.create({
                electronApp,
                expect,
                ideVersion,
                page: newWindowPage,
                platform,
                VError,
              })
              await quickPick.executeCommand(WellKnownCommands.CloseWindow)
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
