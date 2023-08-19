export const create = ({ expect, page, VError }) => {
  return {
    async shouldBeFocused() {
      try {
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeVisible()
        await expect(webView).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to check that webview is focused`)
      }
    },
  }
}
