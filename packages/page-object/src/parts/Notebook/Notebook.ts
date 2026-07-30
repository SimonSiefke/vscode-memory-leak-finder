import { join } from 'path'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Exec from '../Exec/Exec.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WebView from '../WebView/WebView.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const workspace = join(Root.root, '.vscode-test-workspace')

  return {
    async addMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to add markdown cell`)
      }
    },
    async clearAllOutputs() {
      try {
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
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
            electronApp,
            expect,
            ideVersion,
            page,
            platform,
            VError,
          })
          await quickPick.select('Python Environments...', true)
          await quickPick.select(/\.venv/, true)
        }
        if (expectedOutput) {
          const webView = WebView.create({
            electronApp,
            expect,
            ideVersion,
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
        const notebook = page.locator('.notebook-editor')
        await expect(notebook).toBeVisible()
        const cells = notebook.locator(':is(.code-cell-row, .markdown-cell-row)')
        await expect(cells.first()).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
        const initialCellCount = await cells.count()
        if (initialCellCount < cellIndex + 2) {
          throw new Error(`Not enough cells to merge (need at least 2, have ${initialCellCount})`)
        }
        const cell = cells.nth(cellIndex)
        await expect(cell).toBeVisible()
        await cell.hover()
        await page.waitForIdle()
        const moreActions = cell.locator('.cell-title-toolbar [aria-label="More Actions..."]')
        await expect(moreActions).toBeVisible()
        await page.waitForIdle()
        await moreActions.click()
        await page.waitForIdle()
        const contextMenu = page.locator(
          '.monaco-dropdown.active .shadow-root-host:enter-shadow() .context-view.monaco-menu-container .actions-container',
        )
        await expect(contextMenu).toBeVisible()
        await page.waitForIdle()
        const joinAction = contextMenu.locator('.action-item', {
          hasText: 'Join With Next Cell',
        })
        await expect(joinAction).toBeVisible()
        const expectedCellCount = initialCellCount - 1
        for (let attempt = 0; attempt < 3; attempt++) {
          await page.waitForIdle()
          await joinAction.click()
          await page.waitForIdle()
          try {
            await expect(cells).toHaveCount(expectedCellCount, { timeout: 3000 })
            break
          } catch {
            if (!(await contextMenu.isVisible())) {
              break
            }
          }
        }
        await expect(cells).toHaveCount(expectedCellCount, { timeout: 10_000 })
        if (await contextMenu.isVisible()) {
          await page.keyboard.press('Escape')
          await page.waitForIdle()
          await expect(contextMenu).toBeHidden({ timeout: 10_000 })
        }
        await page.waitForIdle()
        await expect(cells.nth(cellIndex).locator('.view-line').nth(1)).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to merge notebook cell at index ${cellIndex}`)
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
        const scrollContainer = page.locator('.notebook-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in notebook`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.notebook-editor .monaco-scrollable-element')
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
        const notebook = page.locator('.notebook-editor')
        await expect(notebook).toBeVisible()
        const cells = notebook.locator(':is(.code-cell-row, .markdown-cell-row)')
        await expect(cells.first()).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
        const initialCellCount = await cells.count()
        if (initialCellCount < cellIndex + 1) {
          throw new Error(`Cell at index ${cellIndex} does not exist`)
        }
        const splitChordModifier = platform === 'darwin' ? 'Meta' : 'Control'
        const expectedCellCount = initialCellCount + 1
        for (let attempt = 0; attempt < 3; attempt++) {
          const cell = cells.nth(cellIndex)
          await expect(cell).toBeVisible()
          const editor = cell.locator('.monaco-editor')
          const editorInput =
            ideVersion && typeof ideVersion === 'object' && 'minor' in ideVersion && ideVersion.minor <= 100
              ? editor.locator('.inputarea')
              : editor.locator('.native-edit-context')
          const splitLine = editor.locator('.view-line').nth(1)
          await expect(splitLine).toBeVisible()
          await page.waitForIdle()
          await splitLine.click()
          await page.waitForIdle()
          await expect(editorInput).toBeFocused()
          await page.waitForIdle()
          await page.keyboard.press('Home')
          await page.waitForIdle()
          await page.keyboard.press(`${splitChordModifier}+k`)
          await page.keyboard.press(`${splitChordModifier}+Shift+\\`)
          await page.waitForIdle()
          try {
            await expect(cells).toHaveCount(expectedCellCount, { timeout: 3000 })
            break
          } catch {
            if ((await cells.count()) !== initialCellCount) {
              break
            }
          }
        }
        await expect(cells).toHaveCount(expectedCellCount, { timeout: 10_000 })
      } catch (error) {
        throw new VError(error, `Failed to split notebook cell at index ${cellIndex}`)
      }
    },
  }
}
