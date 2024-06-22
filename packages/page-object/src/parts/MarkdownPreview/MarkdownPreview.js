export const create = ({ expect, page, VError, electronApp }) => {
  return {
    async shouldHaveHeading(id) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await expect(webView).toHaveClass('ready')
        const heading = page.locator(id)
        await expect(heading).toBeVisible()
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
        const childView = await electronApp.waitForTarget({
          type: 'iframe',
          url: /extensionId=vscode.markdown-language-features/,
        })
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview is visible`)
      }
    },
  }
}
