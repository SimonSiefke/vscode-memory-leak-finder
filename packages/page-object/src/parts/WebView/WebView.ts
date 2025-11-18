// this is a workaround for a race condition in vscode
// where sometimes quickpick opens, but the webview is focused
// and then quickpick doesn't work
const waitForExtraIdle = async (page) => {
  for (let i = 0; i < 30; i++) {
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
    async shouldBeVisible2({ extensionId }) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
        const regex = new RegExp(`extensionId=${extensionId}`)
        const childPage = await page.waitForIframe({
          url: regex,
          injectUtilityScript: false,
        })
        // TODO double iframe...
        const subFrame = await childPage.waitForSubIframe({
          url: regex,
        })
        await subFrame.waitForIdle()
        const linesOfCodeCounter = subFrame.locator('#lines-of-code-counter')
        await expect(linesOfCodeCounter).toBeVisible()
        await subFrame.waitForIdle()
        return subFrame
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
