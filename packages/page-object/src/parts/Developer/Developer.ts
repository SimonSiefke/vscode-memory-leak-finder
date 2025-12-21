import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ page, expect, VError }) => {
  return {
    async toggleScreenCastMode() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleScreenCastMode)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle screencast mode`)
      }
    },
  }
}
