export const create = ({ expect, page, VError }) => {
  return {
    async shouldBeVisible() {
      try {
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
      } catch (error) {
        throw new VError(error, `Failed to check that webview is visible`)
      }
    },
    async focus() {
      try {
        const webView = page.locator('.webview.ready')
        await webView.focus()
        await expect(webView).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to check that webview is focused`)
      }
    },
  }
}
