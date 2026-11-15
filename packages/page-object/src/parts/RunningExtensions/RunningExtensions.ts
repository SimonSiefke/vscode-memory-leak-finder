import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async show() {
      await this.showAndWaitFor('Git')
    },
    async showAndWaitFor(name: string, ...extensionIds: string[]) {
      const quickPick = QuickPick.create({
        electronApp,
        expect,
        ideVersion,
        page,
        platform,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.ShowRunningExtensions)
      await expect(page.locator('.runtime-extensions-editor')).toBeVisible()
      if (ideVersion.minor >= 114) {
        const openInMainWindow = page.locator('[aria-label="Open Modal Editor in Main Window"]')
        await expect(openInMainWindow).toBeVisible()
        await openInMainWindow.click()
      }
      const extension = page.locator('.runtime-extensions-editor .extension .name', { hasExactText: name })
      await expect(extension).toBeVisible()
      for (const id of extensionIds) {
        await expect(page.locator(`.runtime-extensions-editor .monaco-list-row[aria-label="${id}"]`)).toBeVisible()
      }
      const activating = page.locator('.runtime-extensions-editor .activation-time', { hasExactText: 'Activating...' })
      await expect(activating).toBeHidden()
      await page.waitForIdle()
    },
    async startDebuggingExtensionHost() {
      try {
        // TODO this shows a popup that debug extensions are required
        // await page.waitForIdle()
        // const actionLabel = page.locator('.action-label[aria-label="Debug Extension Host In New Window"]')
        // await expect(actionLabel).toBeVisible()
        // await page.waitForIdle()
        // await actionLabel.click()
        // await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to start debugging extension host`)
      }
    },
    async startProfilingExtensionHost() {
      try {
        await page.waitForIdle()
        const actionLabel = page.locator('.action-label[aria-label="Start Extension Host Profile"]')
        await expect(actionLabel).toBeVisible()
        await page.waitForIdle()
        await actionLabel.click()
        await page.waitForIdle()
        await expect(actionLabel).toBeHidden({
          timeout: 15_000,
        })
        const stopLabel = page.locator('.action-label[aria-label="Stop Extension Host Profile"]')
        await expect(stopLabel).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to start profiling extension host`)
      }
    },
    async stopProfilingExtensionHost() {
      try {
        await page.waitForIdle()
        const actionLabel = page.locator('.action-label[aria-label="Stop Extension Host Profile"]')
        await expect(actionLabel).toBeVisible()
        await page.waitForIdle()
        await actionLabel.click()
        await page.waitForIdle()
        await expect(actionLabel).toBeHidden()
        await page.waitForIdle()
        const startLabel = page.locator('.action-label[aria-label="Start Extension Host Profile"]')
        await expect(startLabel).toBeVisible()
        await page.waitForIdle()
        const gitExtensionProfileTime = page.locator('.editor-container [aria-label="git"] .extension .profile-time')
        await expect(gitExtensionProfileTime).toBeVisible()
        await expect(gitExtensionProfileTime).toHaveText(/^Profile: /)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to stop profiling extension host`)
      }
    },
  }
}
