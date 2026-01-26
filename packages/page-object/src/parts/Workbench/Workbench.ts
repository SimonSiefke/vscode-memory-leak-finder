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
    async openNewWindow(): Promise<ISimplifedWindow> {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })

        // Get window IDs before opening a new window
        const windowIdsBeforeRaw = await electron.getWindowIds()
        const windowIdsBefore = Array.isArray(windowIdsBeforeRaw) ? windowIdsBeforeRaw : []

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

        // Wait for a new window ID to appear
        const newWindowId = await this.waitForWindowToShow(windowIdsBefore, electron)

        await page.waitForIdle()

        // If browserRpc is available, set up listener for the new target and capture its sessionRpc
        let newWindowSessionRpc: any = undefined
        if (browserRpc) {
          try {
            // Listen for the new target being attached
            const targetPromise = new Promise<any>((resolve) => {
              const handleNewTarget = (message: any): void => {
                const { sessionId: newSessionId } = message.params
                // Create sessionRpc for the new target
                const sessionRpc = createSessionRpcConnection(browserRpc, newSessionId)
                // Remove this listener after capturing the first target
                browserRpc.off?.('Target.attachedToTarget', handleNewTarget)
                resolve(sessionRpc)
              }
              browserRpc.on('Target.attachedToTarget', handleNewTarget)
            })

            // Wait a bit for the target to be attached, with timeout
            newWindowSessionRpc = await Promise.race([
              targetPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout waiting for target')), 5000)
              ),
            ])
          } catch (error) {
            // If sessionRpc capture fails, continue without it
            console.warn('Failed to capture sessionRpc for new window:', error)
          }
        }

        // Return an object for manipulating the new window
        return {
          async close() {
            try {
              await electron.closeWindow(newWindowId)
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
