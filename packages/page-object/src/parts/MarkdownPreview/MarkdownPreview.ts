import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError, electronApp, ideVersion, platform }: CreateParams) => {
  return {
    async show(){
      const quickPick=QuickPick.create({page, expect, VError, electronApp, ideVersion, platform})
  await quickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  return this.shouldBeVisible()

    },
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
        await page.waitForIdle()
        const markDown = subFrame.locator('.markdown-body')
        await expect(markDown).toBeVisible()
        await subFrame.waitForIdle()
        await page.waitForIdle()
        return subFrame
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
        await subFrame.waitForIdle()
        await page.waitForIdle()
        const heading = subFrame.locator(`#${id}`)
        await expect(heading).toBeVisible()
        await subFrame.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        await new Promise(r=>{})
        throw new VError(error, `Failed to check that markdown preview has heading ${id}`)
      }
    },
  }
}
