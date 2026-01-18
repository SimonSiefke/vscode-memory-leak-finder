import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async toggleScreenCastMode() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleScreenCastMode)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle screencast mode`)
      }
    },
  }
}
