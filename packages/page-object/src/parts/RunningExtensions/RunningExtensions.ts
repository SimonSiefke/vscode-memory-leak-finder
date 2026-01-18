import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async show() {
      const quickPick = QuickPick.create({
        expect,
        page,
        platform,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.ShowRunningExtensions)
      const tabLabel = page.locator('.tab-label[aria-label="Running Extensions"]')
      await expect(tabLabel).toBeVisible()
      const gitExtension = page.locator('.editor-container .extension .name', {
        hasExactText: 'Git',
      })
      await expect(gitExtension).toBeVisible()
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
