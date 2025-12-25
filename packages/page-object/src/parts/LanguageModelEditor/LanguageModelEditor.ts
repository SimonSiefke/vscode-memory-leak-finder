import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, ideVersion, page, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ManageLanguageModels)
        // TODO verify editor is open
        const container = page.locator('.models-search-container')
        await expect(container).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set chat context`)
      }
    },
    async filter({ searchValue, expectedResults }) {
      try {
        // TODO filter
      } catch (error) {
        throw new VError(error, `Failed to filter`)
      }
    },
  }
}
