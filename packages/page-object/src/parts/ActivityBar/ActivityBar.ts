import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as IsMacos from '../IsMacos/IsMacos.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams) => {
  return {
    async hide() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.HideActivityBar)
        await expect(activityBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide activity bar`)
      }
    },
    async hideTooltip() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const ariaLabel = 'Explorer'
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="${ariaLabel}"]`)
        await activityBarItem.hover()
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).toBeVisible()
        await tooltip.focus()
        await expect(tooltip).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(tooltip).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide tooltip`)
      }
    },
    async moveExplorerToPanel() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const ariaLabel = 'Explorer'
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="${ariaLabel}"]`)
        const contextMenu = ContextMenu.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await contextMenu.open(activityBarItem)
        await contextMenu.openSubMenu('Move To', false)
        await contextMenu.select('Panel', false)
      } catch (error) {
        throw new VError(error, `Failed to move explorer to panel`)
      }
    },
    async resetViewLocations() {
      try {
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand('View: Reset View Locations')
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const ariaLabel = 'Explorer'
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="${ariaLabel}"]`)
        await expect(activityBarItem).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to reset view locations`)
      }
    },
    async show() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeHidden()
        const quickPick = QuickPick.create({
          electronApp: undefined,
          expect,
          ideVersion: { major: 0, minor: 0, patch: 0 },
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.FocusActivityBar)
        await expect(activityBar).toBeVisible({ timeout: 10_000 })
      } catch (error) {
        throw new VError(error, `Failed to show activity bar`)
      }
    },
    showExplorer() {
      return this.showView({ ariaLabel: 'Explorer' })
    },
    showExtensions() {
      return this.showView({
        ariaLabel: 'Extensions',
      })
    },
    showRunAndDebug() {
      return this.showView({
        ariaLabel: 'Run and Debug',
        titleLabel: /Run and Debug/,
      })
    },
    showSearch() {
      return this.showView({
        ariaLabel: 'Search',
      })
    },
    showSourceControl() {
      return this.showView({
        ariaLabel: 'Source Control',
      })
    },
    async showTooltipExplorer() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const ariaLabel = 'Explorer'
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="${ariaLabel}"]`)
        await activityBarItem.hover()
        const tooltip = page.locator('[role="tooltip"]')
        await expect(tooltip).toBeVisible()
        const keyBinding = platform && IsMacos.isMacos(platform) ? '⇧⌘E' : 'Ctrl+Shift+E'
        await expect(tooltip).toHaveText(`Explorer (${keyBinding})`)
      } catch (error) {
        throw new VError(error, `Failed to show explorer tooltip`)
      }
    },
    async showView({ ariaLabel, titleLabel = ariaLabel }: { ariaLabel: string; titleLabel?: string | RegExp }) {
      try {
        await page.waitForIdle()
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        await page.waitForIdle()
        const activityBarItem = activityBar.locator(`.action-item:has(.action-label[aria-label^="${ariaLabel}"])`)
        const expanded = await activityBarItem.getAttribute('aria-expanded')
        if (expanded === 'false') {
          await activityBarItem.click()
        }
        await page.waitForIdle()
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText(titleLabel)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show ${ariaLabel.toLowerCase()}`)
      }
    },
  }
}
