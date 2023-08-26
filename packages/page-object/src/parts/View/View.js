import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async enterZenMode() {
      try {
        const indicator = page.locator(`.nostatusbar.fullscreen`)
        await expect(indicator).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleZenMode)
        await expect(indicator).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to enter zen mode`)
      }
    },
    async leaveZenMode() {
      try {
        const indicator = page.locator(`.nostatusbar.fullscreen`)
        await expect(indicator).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleZenMode)
        await expect(indicator).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to leave zen mode`)
      }
    },
  }
}
