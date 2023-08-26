import * as WaitForIdle from '../WaitForIdle/WaitForIdle.js'

export const create = ({ expect, page, VError }) => {
  return {
    async shouldBeVisible() {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
        await page.waitForIdle()
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
