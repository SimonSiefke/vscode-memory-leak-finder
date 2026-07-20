// this is a workaround for a race condition in vscode
// where sometimes quickpick opens, but the webview is focused
// and then quickpick doesn't work
const waitForExtraIdle = async (page: any): Promise<void> => {
  for (let i = 0; i < 30; i++) {
    await page.waitForIdle()
  }
}

import type { CreateParams } from '../CreateParams/CreateParams.ts'

const escapeRegExp = (value: string): string => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async waitForOuterFrame() {
      const webView = page.locator('.webview')
      await expect(webView).toHaveCount(1)
      const webViewReady = page.locator('.webview.ready')
      await expect(webViewReady).toHaveCount(1)
      await expect(webView).toBeVisible({ timeout: 30_000 })
    },
    async waitForInnerFrame({ extensionId, measureTimings }: { extensionId: string; measureTimings: boolean }) {
      const url = new RegExp(`extensionId=${escapeRegExp(extensionId)}`)
      const childPage = await page.waitForIframe({
        injectUtilityScript: false,
        url,
      })
      const deadline = performance.now() + 30_000
      while (performance.now() < deadline) {
        try {
          const frame = await childPage.waitForSubIframe({ url })
          if (!measureTimings) {
            return {
              readyAt: 1,
            }
          }
          const result = await frame.evaluateInUtilityWorld({
            expression: `(() => {
                const readyAt = Number(document.documentElement.dataset.vscodeMemoryLeakFinderReady)
                return readyAt > 0 ? { readyAt } : undefined
              })()`,
          })
          if (result?.readyAt > 0) {
            return result
          }
        } catch {
          // The inner document may still be navigating.
        }
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      throw new Error('webview did not finish loading within 30000ms')
    },
    async shouldHaveLoaded({
      extensionId,
      measureTimings = false,
    }: {
      extensionId: string
      measureTimings: boolean
    }): Promise<{ readyAt: number }> {
      try {
        await this.waitForOuterFrame()
        const result = await this.waitForInnerFrame({ extensionId, measureTimings })
        return result
      } catch (error) {
        throw new VError(error, `Failed to find ready legacy webview for ${extensionId}`)
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
    /**
     * @deprecated use shouldBeVisible2 instead
     */
    async shouldBeVisible() {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await page.waitForIdle()
        await expect(webView).toHaveClass('ready')
        await waitForExtraIdle(page)
      } catch (error) {
        throw new VError(error, `Failed to check that webview is visible`)
      }
    },
    async shouldBeVisible2({
      extensionId,
      hasLineOfCodeCounter = true,
      purpose,
    }: {
      extensionId: string
      hasLineOfCodeCounter?: boolean
      purpose?: string
    }) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview')
        await expect(webView).toBeVisible()
        await page.waitForIdle()
        await expect(webView).toHaveClass('ready')
        await page.waitForIdle()
        const regex = purpose ? new RegExp(`purpose=${purpose}`) : new RegExp(`extensionId=${extensionId}`)
        const childPage = await page.waitForIframe({
          injectUtilityScript: false,
          url: regex,
        })
        // TODO double iframe...
        const subFrame = await childPage.waitForSubIframe({
          url: regex,
        })
        await subFrame.waitForIdle()
        if (hasLineOfCodeCounter) {
          const linesOfCodeCounter = subFrame.locator('#lines-of-code-counter')
          await expect(linesOfCodeCounter).toBeVisible()
        }
        await subFrame.waitForIdle()
        return subFrame
      } catch (error) {
        throw new VError(error, `Failed to check that webview is visible`)
      }
    },
    async shouldHaveContent({
      extensionId,
      selector,
      text,
      focusSelector = '',
    }: {
      extensionId: string
      selector: string
      text: string
      focusSelector: string
    }) {
      try {
        await page.waitForIdle()
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeVisible()
        await page.waitForIdle()
        const url = new RegExp(`extensionId=${extensionId}`)
        const childPage = await page.waitForIframe({
          injectUtilityScript: false,
          url,
        })
        await page.waitForIdle()
        const frame = await childPage.waitForSubIframe({ url })
        await frame.waitForIdle()
        await page.waitForIdle()
        const content = frame.locator(selector)
        await expect(content).toBeVisible()
        await page.waitForIdle()
        if (text) {
          await expect(content).toHaveText(text)
        }
        const readyAt = Number.parseFloat((await content.getAttribute('data-ready-at')) || '')
        await page.waitForIdle()
        await frame.waitForIdle()
        await page.waitForIdle()
        if (focusSelector) {
          const locator = frame.locator(focusSelector)
          await expect(locator).toBeFocused()
          await frame.waitForIdle()
          await page.waitForIdle()
        }
        return { loadTimeMs: (await content.getAttribute('data-load-time-ms')) || '', readyAt }
      } catch (error) {
        throw new VError(error, `Failed to find expected content in legacy webview`)
      }
    },
  }
}
