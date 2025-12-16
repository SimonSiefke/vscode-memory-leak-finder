import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as WebView from '../WebView/WebView.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async focusView() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusOnPullRequestsView)
        await page.waitForIdle()
        const viewlet = page.locator('#workbench\\.view\\.extension\\.github-pull-requests')
        await expect(viewlet).toBeVisible()
        await page.waitForIdle()
        const pullRequests = page.locator('.monaco-list[aria-label="Pull Requests"]')
        await expect(pullRequests).toBeVisible()
        await page.waitForIdle()
        const allOpen = pullRequests.locator('[aria-label="All open pull requests in the current repository"]')
        await expect(allOpen).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to focus on Pull Requests view`)
      }
    },
    async checkoutIndex(index: number): Promise<void> {
      try {
        const adjusted = `${index + 5}`
        const pullRequests = page.locator('.monaco-list[aria-label="Pull Requests"]')
        const item5 = pullRequests.locator(`.monaco-list-row[data-index="${adjusted}"]`)
        await expect(item5).toBeVisible()
        await item5.click()
        await page.waitForIdle()
        const tab = page.locator('.tab[aria-label^="Pull Request"]')
        await expect(tab).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
        const webView = WebView.create({
          page,
          expect,
          VError,
        })
        const subFrame = await webView.shouldBeVisible2({
          extensionId: 'GitHub.vscode-pull-request-github',
          hasLineOfCodeCounter: false,
        })
        await page.waitForIdle()
        await subFrame.waitForIdle()
        const checkoutButton = subFrame.locator('button[title="Checkout"]')
        await expect(checkoutButton).toBeVisible({
          timeout: 45_000,
        })
        await subFrame.waitForIdle()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to find checkout commands`)
      }
    },
  }
}
