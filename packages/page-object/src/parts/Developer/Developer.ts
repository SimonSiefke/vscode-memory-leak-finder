import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

<<<<<<< HEAD
export const create = ({
  expect,
  page,
  VError,
}: {
  expect: any
  page: any
  VError: any
}) => {
=======
export const create = ({ expect, page, platform, VError }) => {
>>>>>>> origin/main
  return {
    async toggleScreenCastMode() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleScreenCastMode)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle screencast mode`)
      }
    },
  }
}
