import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await page.waitForIdle()
        await quickPick.executeCommand(WellKnownCommands.ShowReleaseNotes)
        await page.waitForIdle()
        await expect(webView).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show release notes`)
      }
    },
  }
}
