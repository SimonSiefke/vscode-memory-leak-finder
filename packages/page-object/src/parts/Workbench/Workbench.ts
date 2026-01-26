import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Electron from '../Electron/Electron.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export interface ISimplifedWindow {
  readonly close: () => Promise<void>
  readonly sessionRpc?: any
}

export const create = ({ browserRpc, electronApp, expect, page, platform, VError, ideVersion }: CreateParams) => {
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

  return {
    async waitForWindowToShow(windowIdsBefore: number[], electron: ReturnType<typeof Electron.create>) {
      let windowIdsAfter = windowIdsBefore
      const maxDelay = 15000 // 15 seconds max wait time
      const startTime = performance.now()
      while (windowIdsAfter.length <= windowIdsBefore.length) {
        if (performance.now() - startTime > maxDelay) {
          throw new Error(`New window did not appear within ${maxDelay}ms`)
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        const ids = await electron.getWindowIds()
        windowIdsAfter = Array.isArray(ids) ? ids : []
      }

      // Find the new window ID by comparing the lists
      const newWindowId = windowIdsAfter.find((id: number) => !windowIdsBefore.includes(id))
      if (newWindowId === undefined) {
        throw new Error(`Could not identify the new window ID`)
      }
      return newWindowId
    },
    waitForNewWindow(windowIdsBefore: number[], electron: ReturnType<typeof Electron.create>) {
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
          sessionId = message.params.sessionId
        }
        browserRpc.on('Target.attachedToTarget', handleNewTarget)
      }

      // Poll for new window to appear
      ;(async () => {
        try {
          await this.waitForWindowToShow(windowIdsBefore, electron)
          resolve({ ...(sessionId ? { sessionId } : {}) })
        } catch (error) {
          throw new VError(error, `Failed to wait for new window`)
        }
      })()

      return promise
    },
    async openNewWindow(): Promise<ISimplifedWindow> {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        const windowIdsBeforeRaw = await electron.getWindowIds()
        const windowIdsBefore = Array.isArray(windowIdsBeforeRaw) ? windowIdsBeforeRaw : []
        const newWindowPromise = this.waitForNewWindow(windowIdsBefore, electron)

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
        const { sessionId } = await Promise.race([
          newWindowPromise,
          new Promise<{ sessionId?: string }>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout waiting for new window')), 5000),
          ),
        ])

        // Create sessionRpc connection if sessionId was captured
        if (sessionId && browserRpc) {
          newWindowSessionRpc = createSessionRpcConnection(browserRpc, sessionId)
        }

        await page.waitForIdle()

        // Return an object for manipulating the new window
        return {
          async close() {
            try {
              if (newWindowSessionRpc) {
                const windowQuickPick = QuickPick.create({
                  electronApp,
                  expect,
                  ideVersion,
                  page,
                  platform,
                  VError,
                })
                // Use the window's sessionRpc to close it
                await windowQuickPick.executeCommand(WellKnownCommands.WindowClose, undefined, newWindowSessionRpc)
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
