import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async shouldBeVisible({ useSingleIframe = false }: { useSingleIframe?: boolean } = {}) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await page.waitForIdle()
        const childPage = await page.waitForIframe({
          injectUtilityScript: false,
          url: useSingleIframe
            ? /^vscode-webview:\/\/vscode\.markdown-language-features\//
            : /extensionId=vscode.markdown-language-features/,
        })
        const contentFrame = useSingleIframe
          ? childPage
          : await childPage.waitForSubIframe({
              url: /extensionId=vscode.markdown-language-features/,
            })
        await contentFrame.waitForIdle()
        const markDown = contentFrame.locator('.markdown-body')
        await expect(markDown).toBeVisible()
        await page.waitForIdle()
        return contentFrame
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview is visible`)
      }
    },
    async shouldHaveCodeBlocks(subFrame: any, count: number) {
      try {
        await page.waitForIdle()
        const codeBlocks = subFrame.locator('pre code')
        await expect(codeBlocks).toHaveCount(count)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview has ${count} code blocks`)
      }
    },
    async shouldHaveCodeBlockWithLanguage(subFrame: any, language: string) {
      try {
        await page.waitForIdle()
        const codeBlock = subFrame.locator(`pre code.language-${language}`)
        await expect(codeBlock).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check that markdown preview has code block with language ${language}`)
      }
    },
    async shouldHaveHeading(subFrame: any, id: string) {
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
