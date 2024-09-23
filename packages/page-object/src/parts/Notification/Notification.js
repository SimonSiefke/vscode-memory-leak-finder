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
