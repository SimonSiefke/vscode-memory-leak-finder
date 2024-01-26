import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

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
  }
}
