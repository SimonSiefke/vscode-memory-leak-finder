import type { CreateParams } from '../CreateParams/CreateParams.ts'

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async shouldHaveContent({ extensionId, selector, text }: { extensionId: string; selector: string; text: string }) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeVisible()
        const frame = await page.waitForIframe({
          injectUtilityScript: true,
          url: new RegExp(`^vscode-webview://${escapeRegExp(extensionId)}/`),
        })
        await frame.waitForIdle()
        const content = frame.locator(selector)
        await expect(content).toBeVisible()
        await expect(content).toHaveText(text)
        const readyAt = performance.timeOrigin + performance.now()
        await frame.waitForIdle()
        return { loadTimeMs: (await content.getAttribute('data-load-time-ms')) || '', readyAt }
      } catch (error) {
        throw new VError(error, `Failed to find expected content in single-iframe webview`)
      }
    },
  }
}
