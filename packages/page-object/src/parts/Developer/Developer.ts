import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError, electronApp, ideVersion }: CreateParams) => {
  return {
    async toggleScreenCastMode() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ToggleScreenCastMode)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle screencast mode`)
      }
    },
    async toggleProcessExplorer() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ToggleProcessExplorer)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle process explorer`)
      }
    },
  }
}
