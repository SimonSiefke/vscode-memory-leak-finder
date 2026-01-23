import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'

export const create = ({ expect, page, platform, VError }: CreateParams) => {
  return {
    async hide() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        const panel = Panel.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await panel.hide()
        await expect(markersPanel).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide problems`)
      }
    },
    async shouldHaveCount(count: number) {
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
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ProblemsFocusOnProblemsView)
        await expect(markersPanel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show problems`)
      }
    },
    async switchToTableView() {
      try {
        await page.waitForIdle()
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const panel = page.locator('.part.panel')
        const viewAsTableButton = panel.locator('[aria-label="View as Table"]')
        const count = await viewAsTableButton.count()
        if (count === 0) {
          return
        }
        await viewAsTableButton.click()
        await page.waitForIdle()
        await expect(viewAsTableButton).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to switch to table view`)
      }
    },
    async switchToTreeView() {
      try {
        await page.waitForIdle()
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const panel = page.locator('.part.panel')
        const viewAsListButton = panel.locator('[aria-label="View as Tree"]')
        const count = await viewAsListButton.count()
        if (count === 0) {
          return
        }
        await viewAsListButton.click()
        await page.waitForIdle()
        await expect(viewAsListButton).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to switch to tree view`)
      }
    },
    async moveProblemsToSidebar() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        const moreActions = page.locator('.panel [aria-label="Views and More Actions..."]')
        await expect(moreActions).toBeVisible()
        await moreActions.click()
        const contextMenu = ContextMenu.create({ electronApp: undefined, expect, page, VError })
        await contextMenu.openSubMenu('Move To', false)
        await contextMenu.select('Sidebar', false)
      } catch (error) {
        throw new VError(error, `Failed to move problems to sidebar`)
      }
    },
  }
}
