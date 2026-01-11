import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Electron from '../Electron/Electron.ts'

export const create = ({ expect, page, platform, VError, electronApp }) => {
  return {
    async addMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to add markdown cell`)
      }
    },
    async removeMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to remove markdown cell`)
      }
    },
    async scrollDown() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('[aria-label^="Notebook"] .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in notebook`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('[aria-label^="Notebook"] .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollUp()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in notebook`)
      }
    },
    async executeCell({ index, kernelSource = '' }: { index: number; kernelSource: string }) {
      try {
        await page.waitForIdle()
        const notebook = page.locator('[aria-label^="Notebook"]')
        await expect(notebook).toBeVisible()
        await page.waitForIdle()
        const cells = notebook.locator('.cell.code')
        const cell = cells.nth(index)
        await expect(cell).toBeVisible()
        const runButton = cell.locator('[role="button"][aria-label^="Execute Cell"]')
        await expect(runButton).toBeVisible()
        await page.waitForIdle()
        await runButton.click()
        await page.waitForIdle()

        if (kernelSource) {
          // const electron = Electron.create({ electronApp, VError })
          // await using _ = await electron.mockDialog({
          //   response: 4, // Install
          // })
          const quickPick = QuickPick.create({ page, expect, VError, platform })
          await quickPick.select(kernelSource, true)
          await quickPick.select(' Create Python Environment', true)
          await quickPick.select('Venv', true)
          await quickPick.select(/Python /)

          await new Promise((r) => {})
        }
      } catch (error) {
        throw new VError(error, `Failed to execute notebook cell at index ${index}`)
      }
    },
    async splitCell(cellIndex = 0) {
      try {
        await page.waitForIdle()
        const notebook = page.locator('[aria-label^="Notebook"]')
        await expect(notebook).toBeVisible()
        const cells = notebook.locator('.notebook-cell')
        await expect(cells.first()).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
        const initialCellCount = await cells.count()
        if (initialCellCount < cellIndex + 1) {
          throw new Error(`Cell at index ${cellIndex} does not exist`)
        }
        const cell = cells.nth(cellIndex)
        await expect(cell).toBeVisible()
        await cell.click()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand('Notebook: Split Cell')
        await page.waitForIdle()
        await expect(cells).toHaveCount(initialCellCount + 1)
      } catch (error) {
        throw new VError(error, `Failed to split notebook cell at index ${cellIndex}`)
      }
    },
    async mergeCell(cellIndex = 0) {
      try {
        await page.waitForIdle()
        const notebook = page.locator('[aria-label^="Notebook"]')
        await expect(notebook).toBeVisible()
        const cells = notebook.locator('.notebook-cell')
        await expect(cells.first()).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
        const initialCellCount = await cells.count()
        if (initialCellCount < cellIndex + 2) {
          throw new Error(`Not enough cells to merge (need at least 2, have ${initialCellCount})`)
        }
        const cell = cells.nth(cellIndex)
        await expect(cell).toBeVisible()
        await cell.click()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand('Notebook: Merge Cell')
        await page.waitForIdle()
        await expect(cells).toHaveCount(initialCellCount - 1)
      } catch (error) {
        throw new VError(error, `Failed to merge notebook cell at index ${cellIndex}`)
      }
    },
  }
}
