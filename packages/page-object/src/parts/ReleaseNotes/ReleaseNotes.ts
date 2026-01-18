import type * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async show() {
      try {
        const webView = page.locator('.webview.ready')
        await expect(webView).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await page.waitForIdle()
        await quickPick.show({
          pressKeyOnce: true,
        })
        await quickPick.type('>' + WellKnownCommands.ShowReleaseNotes)
        await quickPick.select(/Show Release Notes/)
        await page.waitForIdle()
        await expect(webView).toBeVisible()
        // TODO verify webview contents
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show release notes`)
      }
    },
  }
}
