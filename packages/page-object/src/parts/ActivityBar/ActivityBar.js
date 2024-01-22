import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as IsMacos from '../IsMacos/IsMacos.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusActivityBar)
        await expect(activityBar).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show activity bar`)
      }
    },
    async showView({ ariaLabel, titleLabel = ariaLabel }) {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-item:has(.action-label[aria-label^="${ariaLabel}"])`)
        const expanded = await activityBarItem.getAttribute('aria-expanded')
        if (expanded === 'false') {
          await activityBarItem.click()
        }
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText(titleLabel)
      } catch (error) {
        throw new VError(error, `Failed to show ${ariaLabel.toLowerCase()}`)
      }
    },
    showExplorer() {
      return this.showView({ ariaLabel: 'Explorer' })
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
    showRunAndDebug() {
      return this.showView({
        ariaLabel: 'Run and Debug',
        titleLabel: /Run and Debug/,
      })
    },
    showExtensions() {
      return this.showView({
        ariaLabel: 'Extensions',
      })
    },
    async hide() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.HideActivityBar)
        await expect(activityBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide activity bar`)
      }
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
        const keyBinding = IsMacos.isMacos ? '⇧⌘E' : 'Ctrl+Shift+E'
        await expect(tooltip).toHaveText(`Explorer (${keyBinding})`)
      } catch (error) {
        throw new VError(error, `Failed to show explorer tooltip`)
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
  }
}
