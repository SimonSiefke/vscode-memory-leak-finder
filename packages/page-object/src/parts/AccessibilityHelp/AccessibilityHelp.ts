import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getWidget = () => page.locator('.accessible-view-container .accessible-view')

  return {
    async close() {
      try {
        const widget = getWidget()
        await expect(widget).toBeVisible()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(widget).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close Accessibility Help`)
      }
    },
    async open() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand('Open Accessibility Help')
        const widget = getWidget()
        await expect(widget).toBeVisible()
        await expect(widget.locator('.accessible-view-title')).toHaveText('Accessibility Help')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open Accessibility Help`)
      }
    },
  }
}
