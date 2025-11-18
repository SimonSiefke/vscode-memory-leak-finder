import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
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
  }
}
