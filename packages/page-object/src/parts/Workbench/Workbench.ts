import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Electron from '../Electron/Electron.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export interface ISimplifedWindow {
  readonly close: () => Promise<void>
}

export const create = ({ electronApp, expect, page, platform, VError, ideVersion }: CreateParams) => {
  return {
    async openNewWindow(): Promise<ISimplifedWindow> {
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
        const maxDelay = 5000 // 5 seconds max wait time
        const startTime = performance.now()
        while (currentWindowCount <= initialWindowCount) {
          if (performance.now() - startTime > maxDelay) {
            throw new VError({}, `New window did not appear within ${maxDelay}ms`)
          }
          await new Promise((resolve) => setTimeout(resolve, 100))
          currentWindowCount = await electron.getWindowCount()
        }

        await page.waitForIdle()

        // Get the new window ID
        const newWindowId = await electron.getNewWindowId()

        // Return an object for manipulating the new window
        return {
          async close() {
            try {
              await electron.closeWindow(newWindowId)
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
