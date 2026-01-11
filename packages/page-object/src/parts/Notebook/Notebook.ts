import { join } from 'path'
import * as Exec from '../Exec/Exec.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'

export const create = ({ expect, page, platform, VError, electronApp }) => {
  const workspace = join(Root.root, '.vscode-test-workspace')

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
          const quickPick = QuickPick.create({ page, expect, VError, platform })
          await quickPick.select(/\.venv/, true)
          await quickPick.select(' Create Python Environment', true)
          await quickPick.select('Venv', true)
          await page.waitForIdle()
          // const focused = page.locator('.quick-input-list .monaco-list-row[data-index="1"]')
          // await expect(focused).toBeVisible()
          // await expect(focused).toHaveText(/Python/)
          // await page.waitForIdle()
          // await focused.click()
          // await page.waitForIdle()
          // await quickPick.select(/Python /)

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
    async createVenv() {
      try {
        await Exec.exec('python3', ['-m', 'venv', '.venv'], { cwd: workspace, env: { ...process.env } })
        // await Exec.exec('bash', ['-c', 'source .venv/bin/activate && python -m pip install -r requirements.txt'], {
        //   cwd: workspace,
        //   env: { ...process.env },
        // })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create venv`)
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
