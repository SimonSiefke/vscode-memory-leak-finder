import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async clearFilter() {
      try {
        await page.waitForIdle()
        const modeleditor = page.locator('.ai-models-management-editor')
        const clearButton = modeleditor.locator('[aria-label="Clear Search"]')
        await expect(clearButton).toBeVisible()
        await page.waitForIdle()
        await this.waitForCountChange(async () => {
          await clearButton.click()
        })
        await page.waitForIdle()
        const lines = modeleditor.locator('.models-search-container .view-lines')
        await expect(lines).toBeVisible()
        await expect(lines).toHaveText('')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear filter`)
      }
    },
    async filter({ expectedResults, searchValue }) {
      try {
        await page.waitForIdle()
        const table = page.locator('.ai-models-management-editor .models-table-container')
        await expect(table).toBeVisible()
        await page.waitForIdle()
        const rows = table.locator('.monaco-list-row')
        const firstRow = rows.nth(1)
        await expect(firstRow).toBeVisible()
        await page.waitForIdle()
        await page.waitForIdle()
        const editContext = page.locator('.models-search-container .monaco-editor .native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        await this.waitForCountChange(async () => {
          await editContext.type(searchValue)
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to filter`)
      }
    },
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
        const firstRow = rows.nth(0)
        await expect(firstRow).toBeVisible({
          timeout: 30_000,
        })
        await page.waitForIdle()
        const secondRow = rows.nth(1)
        await expect(secondRow).toBeVisible({
          timeout: 30_000,
        })
        await page.waitForIdle()
        const thirdRow = rows.nth(2)
        await expect(thirdRow).toBeVisible({
          timeout: 30_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set chat context`)
      }
    },
    async waitForCountChange(action: () => Promise<void>) {
      const table = page.locator('.ai-models-management-editor .models-table-container')
      await expect(table).toBeVisible()
      await page.waitForIdle()
      const rows = table.locator('.monaco-list-row')
      const count = await rows.count()
      await page.waitForIdle()
      const editContext = page.locator('.models-search-container .monaco-editor .native-edit-context')
      await expect(editContext).toBeVisible()
      await page.waitForIdle()
      await action()
      await page.waitForIdle()
      let now = performance.now()
      const maxWait = 15_000
      const end = now + maxWait
      while (now < end) {
        await page.waitForIdle()
        const newCount = await rows.count()
        if (newCount !== count) {
          break
        }
        now = performance.now()
      }
      const newCount = await rows.count()
      if (newCount === count) {
        throw new Error(`Filter has no effect: oldCount: ${count}, newCount: ${newCount}`)
      }
      await page.waitForIdle()
    },
  }
}
