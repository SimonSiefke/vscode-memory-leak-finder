import * as CreateParams from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams.CreateParams) => {
  return {
    async shouldBeVisible() {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await page.waitForIdle()
        await expect(webView).toHaveClass('ready')
        await page.waitForIdle()
        const childPage = await page.waitForIframe({
          injectUtilityScript: false,
          url: /extensionId=vscode.markdown-language-features/,
        })
        // TODO double iframe...
        const subFrame = await childPage.waitForSubIframe({
          url: /extensionId=vscode.markdown-language-features/,
        })
        await subFrame.waitForIdle()
        const markDown = subFrame.locator('.markdown-body')
        await expect(markDown).toBeVisible()
        await page.waitForIdle()
        return subFrame
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview is visible`)
      }
    },
    async shouldHaveCodeBlocks(subFrame, count) {
      try {
        await page.waitForIdle()
        const codeBlocks = subFrame.locator('pre code')
        await expect(codeBlocks).toHaveCount(count)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview has ${count} code blocks`)
      }
    },
    async shouldHaveCodeBlockWithLanguage(subFrame, language) {
      try {
        await page.waitForIdle()
        const codeBlock = subFrame.locator(`pre code.language-${language}`)
        await expect(codeBlock).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview has code block with language ${language}`)
      }
    },
    async shouldHaveHeading(subFrame, id) {
      try {
        await page.waitForIdle()
        const heading = subFrame.locator(`#${id}`)
        await expect(heading).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview has heading ${id}`)
      }
    },
  }
}
