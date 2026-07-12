import type { CreateParams } from '../CreateParams/CreateParams.ts'

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async shouldHaveLoaded({ extensionId }: { extensionId: string }): Promise<{ readyAt: number }> {
      try {
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible({ timeout: 30_000 })
        const frame = await page.waitForIframe({
          injectUtilityScript: false,
          url: new RegExp(`^vscode-webview://${escapeRegExp(extensionId)}/`),
        })
        const deadline = performance.now() + 30_000
        while (performance.now() < deadline) {
          try {
            const result = await frame.evaluateInMainWorld({
              expression: `(() => {
                const readyAt = Number(document.documentElement.dataset.vscodeMemoryLeakFinderReady)
                return readyAt > 0 ? { readyAt } : undefined
              })()`,
            })
            if (result?.readyAt > 0) {
              return result
            }
          } catch {
            // The document may still be navigating.
          }
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
        throw new Error('webview did not report ready within 30000ms')
      } catch (error) {
        throw new VError(error, `Failed to find ready single-iframe webview for ${extensionId}`)
      }
    },
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
        const readyAt = Number.parseFloat((await content.getAttribute('data-ready-at')) || '')
        await frame.waitForIdle()
        return { loadTimeMs: (await content.getAttribute('data-load-time-ms')) || '', readyAt }
      } catch (error) {
        throw new VError(error, `Failed to find expected content in single-iframe webview`)
      }
    },
  }
}
