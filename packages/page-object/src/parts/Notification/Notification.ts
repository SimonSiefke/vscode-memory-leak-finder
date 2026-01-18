import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async closeAll() {
      try {
        await page.waitForIdle()
        const toastContainer = page.locator('.notifications-toasts')
        await expect(toastContainer).toBeVisible()
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
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
        const toasts = page.locator('.notifications-toasts')
        await expect(toasts).toBeVisible({ timeout: 10_000 })
        const notificationList = page.locator('.notifications-list-container')
        await expect(notificationList).toBeVisible()
        await page.waitForIdle()
        const item = notificationList.locator(`[aria-label^="Info: ${expectedMessage}"]`)
        await expect(item).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check notification ${expectedMessage}`)
      }
    },
  }
}
