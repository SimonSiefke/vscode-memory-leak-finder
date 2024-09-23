import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as IsMacos from '../IsMacos/IsMacos.js'

export const create = ({ expect, page, VError }) => {
  return {
    async closeAll() {
      try {
        const toastContainer = page.locator('.notifications-toasts')
        await expect(toastContainer).toBeVisible()
        await expect(toastContainer).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close notifications`)
      }
    },
  }
}
