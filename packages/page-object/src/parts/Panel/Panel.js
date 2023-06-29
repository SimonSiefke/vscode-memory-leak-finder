import * as QuickPick from '../QuickPick/QuickPick.js'

export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.showCommands()
        await quickPick.type('Toggle Panel Visibility')
        await new Promise((r) => {
          setTimeout(r, 1000)
        })
        await quickPick.select('View: Toggle Panel Visibility')
      } catch (error) {
        // throw new VError(error, `Failed to toggle panel`)
        await new Promise(() => {})
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
    async hide() {
      try {
        const panel = page.locator('.part.panel')
        await expect(panel).toBeVisible()
        await new Promise((r) => {
          setTimeout(r, 1000)
        })
        await this.toggle()
        await new Promise((r) => {
          setTimeout(r, 1000)
        })
        await expect(panel).toBeHidden()
        const group = page.locator('.editor-group-container')
        await expect(group).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to hide panel`)
      }
    },
  }
}
