import { join } from 'path'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Exec from '../Exec/Exec.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WebView from '../WebView/WebView.ts'

export const create = ({ expect, page, platform, VError }: CreateParams) => {
  const workspace = join(Root.root, '.vscode-test-workspace')

  return {
    async addMarkdownCell() {
      try {} catch (error) {
        throw new VError(error, `Failed to add markdown cell`)
      }
    },
    async clearAllOutputs() {
      try {
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand('Notebook: Clear All Outputs')
      } catch (error) {
        throw new VError(error, `Failed to clear outputs`)
      }
    },
    async createVenv() {
      try {
        await Exec.exec('python3', ['-m', 'venv', '.venv'], { cwd: workspace, env: { ...process.env } })
        await Exec.exec('bash', ['-c', 'source .venv/bin/activate && python -m pip install ipykernel'], {
          cwd: workspace,
          env: { ...process.env },
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create venv`)
      }
    },
    async executeCell({ expectedOutput, index, kernelSource = '' }: { index: number; kernelSource: string; expectedOutput: string }) {
      try {
        await page.waitForIdle()
        const notebook = page.locator('.notebook-editor')
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
          const quickPick = QuickPick.create({
            electronApp: undefined,
            expect,
            ideVersion: { major: 0, minor: 0, patch: 0 },
            page,
            platform,
            VError,
          })
          await quickPick.select('Python Environments...', true)
          await quickPick.select(/\.venv/, true)
        }
        if (expectedOutput) {
          const webView = WebView.create({
            electronApp: undefined,
            expect,
            ideVersion: { major: 0, minor: 0, patch: 0 },
            page,
            platform: '',
            VError,
          })
          const notebookOutput = await webView.shouldBeVisible2({
            extensionId: '',
            hasLineOfCodeCounter: false,
            purpose: 'notebookRenderer',
          })
          const output = notebookOutput.locator('.output_container')
          await expect(output).toBeVisible()
          await page.waitForIdle()
          await expect(output).toHaveText(expectedOutput)
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to execute notebook cell at index ${index}`)
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
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand('Notebook: Merge Cell')
        await page.waitForIdle()
        await expect(cells).toHaveCount(initialCellCount - 1)
      } catch (error) {
        throw new VError(error, `Failed to merge notebook cell at index ${cellIndex}`)
      }
    },
    async removeMarkdownCell() {
      try {} catch (error) {
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
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand('Notebook: Split Cell')
        await page.waitForIdle()
        await expect(cells).toHaveCount(initialCellCount + 1)
      } catch (error) {
        throw new VError(error, `Failed to split notebook cell at index ${cellIndex}`)
      }
    },
  }
}
