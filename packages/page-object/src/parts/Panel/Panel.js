import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.TogglePanelVisibilty)
      } catch (error) {
        throw new VError(error, `Failed to toggle panel`)
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
    async closeOrHide(text) {
      try {
        const panel = page.locator('.part.panel')
        const isVisible = await panel.isVisible()
        if (!isVisible) {
          return
        }
        await expect(panel).toBeVisible()
        const closeButton = page.locator(`[aria-label="${text}"]`)
        await closeButton.click()
        await expect(panel).toBeHidden()
        const group = page.locator('.editor-group-container')
        await expect(group).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to hide panel`)
      }
    },
    async hide() {
      return this.closeOrHide('Hide Panel')
    },
    async close() {
      return this.closeOrHide('Close Panel')
    },
  }
}
