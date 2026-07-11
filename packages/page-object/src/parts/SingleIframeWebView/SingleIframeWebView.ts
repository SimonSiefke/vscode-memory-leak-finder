import type { CreateParams } from '../CreateParams/CreateParams.ts'

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async shouldHaveContent({ extensionId, selector, text }: { extensionId: string; selector: string; text: string }): Promise<void> {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeVisible()
        const frame = await page.waitForIframe({
          injectUtilityScript: false,
          url: new RegExp(`^vscode-webview://${escapeRegExp(extensionId)}/`),
        })
        await frame.waitForIdle()
        const content = frame.locator(selector)
        await expect(content).toBeVisible()
        await expect(content).toHaveText(text)
        await frame.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to find expected content in single-iframe webview`)
      }
    },
  }
}
