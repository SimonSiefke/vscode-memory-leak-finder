import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.PreferencesOpenSettingsUi)
        await page.waitForIdle()
        const settingsSwitcher = page.locator('[aria-label="Settings Switcher"]')
        await expect(settingsSwitcher).toBeVisible()
        await page.waitForIdle()
        const body = page.locator('.settings-body')
        await expect(body).toBeVisible()
        await page.waitForIdle()
        const rightControls = page.locator('.settings-right-controls')
        await expect(rightControls).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open settings ui`)
      }
    },
  }
}
