import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async closeAll() {
      try {
        await page.waitForIdle()
        const toastContainer = page.locator('.notifications-toasts')
        await expect(toastContainer).toBeVisible()
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.CloseAllNotifications)
        await expect(toastContainer).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close notifications`)
      }
    },
    async shouldHaveItem(expectedMessage: string) {
      try {
        await page.waitForIdle()
        const toasts = page.locator('.notifications-toasts')
        await expect(toasts).toBeVisible({ timeout: 10_000 })
        const notificationList = page.locator('.notifications-list-container')
        await expect(notificationList).toBeVisible()
        const item = notificationList.locator(`[aria-label^="Info: ${expectedMessage}"]`)
        await expect(item).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check notification ${expectedMessage}`)
      }
    },
  }
}
