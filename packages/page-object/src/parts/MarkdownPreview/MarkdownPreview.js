export const create = ({ expect, page, VError, electronApp }) => {
  return {
    async shouldHaveHeading(id) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
        const childPage = await electronApp.waitForIframe({
          url: /extensionId=vscode.markdown-language-features/,
        })
        const frame = childPage.frameLocator('iframe')
        const childChildPage = childPage.getIframe(0)
        const heading = childChildPage.locator(`#${id}`)
        await expect(heading).toBeVisible()
        await new Promise((r) => {})
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview has heading ${id}`)
      }
    },
    async shouldBeVisible() {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
        await electronApp.waitForIframe({
          url: /extensionId=vscode.markdown-language-features/,
        })
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview is visible`)
      }
    },
  }
}
