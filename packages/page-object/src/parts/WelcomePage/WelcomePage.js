import * as Editor from '../Editor/Editor.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.HelpWelcome)
        await expect(gettingStartedContainer).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show welcome page`)
      }
    },
    async hide() {
      try {
        const gettingStartedContainer = page.locator('.gettingStartedContainer')
        await expect(gettingStartedContainer).toBeVisible()
        const editor = Editor.create({ expect, page, VError })
        await editor.closeAll()
        await expect(gettingStartedContainer).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide welcome page`)
      }
    },
  }
}
