import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError, electronApp, ideVersion }: CreateParams) => {
  return {
    async toggle() {
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
        // TODO verify window is visible and shows process explorer results
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle process explorer`)
      }
    },
    async show() {
      try {
        await this.toggle()
      } catch (error) {
        throw new VError(error, `Failed to show process explorer`)
      }
    },
    async hide() {
      try {
        await this.toggle()
      } catch (error) {
        throw new VError(error, `Failed to hide process explorer`)
      }
    },
  }
}
