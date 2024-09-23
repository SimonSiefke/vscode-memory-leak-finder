import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async closeAll() {
      try {
        const toastContainer = page.locator('.notifications-toasts')
        await expect(toastContainer).toBeVisible()
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.CloseAllNotifications)
        await expect(toastContainer).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close notifications`)
      }
    },
  }
}
