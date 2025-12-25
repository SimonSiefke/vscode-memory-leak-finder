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
        const table = page.locator('.ai-models-management-editor .models-table-container')
        await expect(table).toBeVisible()
        await page.waitForIdle()
        const progress = page.locator('.monaco-progress-container.active.infinite')
        await expect(progress).toBeHidden({ timeout: 30_000 })
        await page.waitForIdle()
        const rows = table.locator('.monaco-list-row')
        const firstRow = rows.nth(1)
        await expect(firstRow).toBeVisible({
          timeout: 30_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set chat context`)
      }
    },
    async filter({ searchValue, expectedResults }) {
      try {
        await page.waitForIdle()
        const table = page.locator('.ai-models-management-editor .models-table-container')
        await expect(table).toBeVisible()
        await page.waitForIdle()
        const rows = table.locator('.monaco-list-row')
        const firstRow = rows.nth(1)
        await expect(firstRow).toBeVisible()
        await page.waitForIdle()
        const count = await rows.count()
        await page.waitForIdle()
        const editContext = page.locator('.models-search-container .monaco-editor .native-edit-context')
        await editContext.type(searchValue)
        await page.waitForIdle()
        const newCount = await rows.count()
        console.log({ newCount })

        // TODO filter
      } catch (error) {
        throw new VError(error, `Failed to filter`)
      }
    },
    async clearFilter() {
      try {
        await page.waitForIdle()
        const editContext = page.locator('.models-search-container .monaco-editor .native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        await editContext.clear()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to filter`)
      }
    },
  }
}
