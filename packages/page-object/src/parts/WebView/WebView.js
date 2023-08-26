// this is a workaround for a race condition in vscode
// where sometimes quickpick opens, but the webview is focused
// and then quickpick doesn't work
const waitForExtraIdle = async (page) => {
  for (let i = 0; i < 20; i++) {
    await page.waitForIdle()
  }
}

export const create = ({ expect, page, VError }) => {
  return {
    async shouldBeVisible() {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
        await waitForExtraIdle(page)
      } catch (error) {
        throw new VError(error, `Failed to check that webview is visible`)
      }
    },
    async focus() {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview.ready')
        await webView.focus()
        await expect(webView).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check that webview is focused`)
      }
    },
  }
}
