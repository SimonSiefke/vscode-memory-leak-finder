import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async closeAll({ force = false } = {}) {
      try {
        await page.waitForIdle()
        const toastContainer = page.locator('.notifications-toasts')
        if (!force) {
          await expect(toastContainer).toBeVisible()
        }
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.CloseAllNotifications)
        await expect(toastContainer).toBeHidden()
        await page.waitForIdle()
        await expect(toastContainer).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close notifications`)
      }
    },
    async shouldHaveItem(expectedMessage: string) {
      try {
        await page.waitForIdle()
        const notificationList = page.locator('.notifications-list-container')
        const item = notificationList.locator(`[aria-label^="Info: ${expectedMessage}"]`)
        await expect(item).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check notification ${expectedMessage}`)
      }
    },
  }
}
