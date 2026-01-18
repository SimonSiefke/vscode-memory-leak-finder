import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams) => {
  return {
    async enterZenMode() {
      try {
        const indicator = page.locator(`.nostatusbar.fullscreen`)
        await expect(indicator).toBeHidden()
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
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
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleZenMode)
        await expect(indicator).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to leave zen mode`)
      }
    },
  }
}
