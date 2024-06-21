import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.PreferencesOpenSettingsUi)
        // const heading=page.locator('settings-group-title-label', {
        //   hasText:'Commonly Used'
        // })
        // await expect(heading).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to open settings ui`)
      }
    },
  }
}
