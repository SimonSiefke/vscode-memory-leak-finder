import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Editor from '../Editor/Editor.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const getMatchingText = async (styleElements, className) => {
  const [first, second] = className.split(' ')
  const styleCount = await styleElements.count()
  for (let i = 0; i < styleCount; i++) {
    const styleElement = styleElements.nth(i)
    const text = await styleElement.textContent({ allowHidden: true })
    console.log(text)
    if (text.includes(first) || text.includes(second)) {
      return text
    }
  }
  return ''
}

export const create = ({ expect, page, VError, ideVersion }) => {
  return {
    async shouldHaveUnstagedFile(name) {
      try {
        const changesPart = page.locator('[role="treeitem"][aria-label="Changes"]')
        await expect(changesPart).toBeVisible()
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        await expect(file).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to check unstaged file`)
      }
    },
    async stageFile(name) {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.GitStageAllChanges)
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        await expect(file).toHaveAttribute('aria-label', `${name}, Index Added`)
      } catch (error) {
        throw new VError(error, `Failed to stage file`)
      }
    },
    async unstageFile(name) {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.GitUnstageAllChanges)
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        await expect(file).toHaveAttribute('aria-label', `${name}, Untracked`)
      } catch (error) {
        throw new VError(error, `Failed to unstage file`)
      }
    },
    async shouldHaveHistoryItem(name) {
      try {
        const history = page.locator('[aria-label="Source Control History"]')
        await expect(history).toBeVisible()
        const item = history.locator(`.monaco-list-row[aria-label^="${name}"]`)
        await expect(item).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify history item`)
      }
    },
    async shouldNotHaveHistoryItem(name) {
      try {
        const history = page.locator('[aria-label="Source Control History"]')
        await expect(history).toBeVisible()
        const item = history.locator(`.monaco-list-row[aria-label^="${name}"]`)
        await expect(item).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify that history item is hidden`)
      }
    },
    async undoLastCommit() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.UndoLastCommit)
      } catch (error) {
        throw new VError(error, `Failed to undo last commit`)
      }
    },
    async refresh() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.GitRefresh)
      } catch (error) {
        throw new VError(error, `Failed to git refresh`)
      }
    },
    async showBranchPicker() {
      try {
        await page.waitForIdle()
        const graphSection = page.locator('[aria-label="Graph Section"]')
        await expect(graphSection).toBeVisible()
        const action = graphSection.locator('a.scm-graph-history-item-picker')
        await expect(action).toHaveAttribute('aria-disabled', null)
        await expect(action).toBeVisible()
        await page.waitForIdle()
        await action.click()
        await page.waitForIdle()
        const quickInput = page.locator('.quick-input-widget.show-checkboxes')
        await expect(quickInput).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show branch picker`)
      }
    },
    async hideBranchPicker() {
      try {
        await page.waitForIdle()
        const quickInput = page.locator('.quick-input-widget.show-checkboxes')
        await expect(quickInput).toBeVisible()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(quickInput).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide branch picker`)
      }
    },
    async enableInlineBlame() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleBlameEditorDecoration)
        await page.waitForIdle()
        const editor = Editor.create({ page, expect, VError, ideVersion })
        await editor.focus()
        await editor.cursorRight()
        await page.waitForIdle()
        const decoration = page.locator('[class^="ced-1-TextEditorDecorationType"]').nth(1)
        await expect(decoration).toBeVisible()
        await page.waitForIdle()
        const className = await decoration.getAttribute('class')
        const styleElements = page.locator('style')
        const text = await getMatchingText(styleElements, className)
        await new Promise((r) => {})
        if (!text) {
          throw new Error(`decoration css not found`)
        }
        console.log({ text, className })
        // TODO get all style sheets, and try to find the one containg this class
        // then parse the class and query the content property to get the text content
        // finally verify the text content matches the expected content
      } catch (error) {
        throw new VError(error, `Failed to enable inline blame`)
      }
    },
    async disableInlineBlame() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleBlameEditorDecoration)
        await page.waitForIdle()
        // TODO verify that inline blame is hidden
      } catch (error) {
        throw new VError(error, `Failed to disable inline`)
      }
    },
  }
}
