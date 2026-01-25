import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Electron from '../Electron/Electron.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, page, platform, VError, ideVersion }: CreateParams) => {
  return {
    async openNewWindow() {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        const initialWindowCount = await electron.getWindowCount()
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

        // Wait for window count to increase
        let currentWindowCount = initialWindowCount
        while (currentWindowCount <= initialWindowCount) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          currentWindowCount = await electron.getWindowCount()
        }

        await page.waitForIdle()

        // Get the new window ID
        const newWindowId = await electron.evaluate(`(() => {
          const { BrowserWindow } = globalThis._____electron
          const allWindows = BrowserWindow.getAllWindows()
          // Return the ID of the last window (the one just created)
          if (allWindows.length > 0) {
            return allWindows[allWindows.length - 1].id
          }
          return null
        })()`)

        // Return an object for manipulating the new window
        return {
          async close() {
            try {
              await electron.evaluate(`(() => {
                const { BrowserWindow } = globalThis._____electron
                const window = BrowserWindow.fromId(${newWindowId})
                if (window && !window.isDestroyed()) {
                  window.close()
                }
              })()`)
            } catch (error) {
              throw new VError(error, `Failed to close new window`)
            }
          },
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
