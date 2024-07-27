import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      const quickPick = QuickPick.create({
        page,
        expect,
        VError,
      })
      await quickPick.executeCommand(WellKnownCommands.ShowRunningExtensions)
      const tabLabel = page.locator('.tab-label[aria-label="Running Extensions"]')
      await expect(tabLabel).toBeVisible()
      const gitExtension = page.locator('.editor-container .extension .name', {
        hasExactText: 'Git',
      })
      await expect(gitExtension).toBeVisible()
    },
    async startDebuggingExtensionHost() {
      try {
        const actionLabel = page.locator('.action-label[aria-label="Start Debugging Extension Host"]')
        await expect(actionLabel).toBeVisible()
        await actionLabel.click()
      } catch (error) {
        throw new VError(error, `Failed to start debugging extension host`)
      }
    },
    async startProfilingExtensionHost() {
      try {
        const actionLabel = page.locator('.action-label[aria-label="Start Extension Host Profile"]')
        await expect(actionLabel).toBeVisible()
        await actionLabel.click()
        await expect(actionLabel).toBeHidden({
          timeout: 15_000,
        })
        const stopLabel = page.locator('.action-label[aria-label="Stop Extension Host Profile"]')
        await expect(stopLabel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to start profiling extension host`)
      }
    },
    async stopProfilingExtensionHost() {
      try {
        const actionLabel = page.locator('.action-label[aria-label="Stop Extension Host Profile"]')
        await expect(actionLabel).toBeVisible()
        await actionLabel.click()
        await expect(actionLabel).toBeHidden()
        const startLabel = page.locator('.action-label[aria-label="Start Extension Host Profile"]')
        await expect(startLabel).toBeVisible()
        const gitExtensionProfileTime = page.locator('.editor-container [aria-label="git"] .extension .profile-time')
        await expect(gitExtensionProfileTime).toBeVisible()
        await expect(gitExtensionProfileTime).toHaveText(/^Profile: /)
      } catch (error) {
        throw new VError(error, `Failed to stop profiling extension host`)
      }
    },
  }
}
