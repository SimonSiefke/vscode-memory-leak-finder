export const create = ({ expect, page, VError }) => {
  return {
    async shouldBeVisible() {
      try {
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeVisible()
        const body = page.locator('body')
        await expect(body).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to check that webview is visible`)
      }
    },
  }
}
