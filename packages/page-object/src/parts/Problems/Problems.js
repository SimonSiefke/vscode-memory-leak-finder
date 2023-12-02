import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as Panel from '../Panel/Panel.js'

export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveCount(count) {
      try {
        const problemsBadge = page.locator('[role="tab"] [aria-label^="Problems"] + .badge')
        const badgeContent = problemsBadge.locator('.badge-content')
        if (count === 0) {
          await expect(problemsBadge).toBeHidden()
        } else {
          await expect(problemsBadge).toBeVisible()
          await expect(badgeContent).toHaveText(`${count}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to assert problems count of ${count}`)
      }
    },
    async show() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ProblemsFocusOnProblemsView)
        await expect(markersPanel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show problems`)
      }
    },
    async hide() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
        await expect(markersPanel).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide problems`)
      }
    },
  }
}
