export const create = ({ expect, page, VError }) => {
  return {
    async shouldBeVisible() {
      try {
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeVisible()
        const focusedElement = page.locator('body, .webview.ready')
        await expect(focusedElement).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to check that webview is visible`)
      }
    },
  }
}
