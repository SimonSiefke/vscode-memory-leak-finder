import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async hide() {
      try {
        const panel = page.locator('.part.panel')
        const isVisible = await panel.isVisible()
        if (!isVisible) {
          return
        }
        await expect(panel).toBeVisible()
        const closeButton = page.locator('[aria-label^="Hide Panel"]')
        await closeButton.click()
        await expect(panel).toBeHidden()
        const group = page.locator('.editor-group-container')
        await expect(group).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to hide panel`)
      }
    },
    async show() {
      try {
        const panel = page.locator('.part.panel')
        await expect(panel).toBeHidden()
        await this.toggle()
        await expect(panel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show panel`)
      }
    },
    async toggle() {
      try {
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.TogglePanelVisibilty)
      } catch (error) {
        throw new VError(error, `Failed to toggle panel`)
      }
    },
  }
}
