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
      } catch (error) {
        throw new VError(error, `Failed to stage file`)
      }
    },
    async unstageFile(name) {
      try {
      } catch (error) {
        throw new VError(error, `Failed to unstage file`)
      }
    },
  }
}
