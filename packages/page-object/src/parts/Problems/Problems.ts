import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getMarkersPanel = () => page.locator('.markers-panel')

  return {
    async clearFilter() {
      try {
        await page.waitForIdle()
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const input = markersPanel.locator('.input[placeholder^="Filter"]')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        await input.focus()
        await page.waitForIdle()
        await expect(input).toBeFocused()
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await expect(input).toHaveValue('')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear problems filter`)
      }
    },
    async filter(filterValue: string) {
      try {
        await page.waitForIdle()
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const input = markersPanel.locator('.input[placeholder^="Filter"]')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        await input.focus()
        await page.waitForIdle()
        await expect(input).toBeFocused()
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await input.setValue(filterValue)
        await page.waitForIdle()
        await expect(input).toHaveValue(filterValue)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to filter problems`)
      }
    },
    async hide() {
      try {
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeVisible()
        const panel = Panel.create({ electronApp, expect, ideVersion, page, platform, VError })
        await panel.hide()
        await expect(markersPanel).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide problems`)
      }
    },
    async moveProblemsToSidebar() {
      try {
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeVisible()
        const moreActions = page.locator('.panel [aria-label="Views and More Actions..."]')
        await expect(moreActions).toBeVisible()
        await moreActions.click()
        const contextMenu = ContextMenu.create({ electronApp, expect, ideVersion, page, platform, VError })
        await contextMenu.openSubMenu('Move To', false)
        await contextMenu.select('Sidebar', false)
      } catch (error) {
        throw new VError(error, `Failed to move problems to sidebar`)
      }
    },
    async shouldHaveVisibleCount(count: number) {
      try {
        await page.waitForIdle()
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const rows = markersPanel.locator('.monaco-list-row')
        await expect(rows).toHaveCount(count, {
          timeout: 15_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to assert visible problems count of ${count}`)
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
    async shouldHaveVisibleTextCount(text: string, count: number) {
      try {
        await page.waitForIdle()
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const rows = markersPanel.locator('.monaco-list-row', {
          hasText: text,
        })
        await expect(rows).toHaveCount(count, {
          timeout: 15_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to assert visible problem text count for ${text}`)
      }
    },
    async show() {
      try {
        const markersPanel = getMarkersPanel()
        await expect(markersPanel).toBeHidden()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
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
        const markersPanel = getMarkersPanel()
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
        const markersPanel = getMarkersPanel()
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
  }
}
