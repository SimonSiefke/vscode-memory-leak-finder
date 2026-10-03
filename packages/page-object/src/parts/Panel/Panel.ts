import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async hide() {
      try {
        const panel = page.locator('.part.panel')
        const isVisible = await panel.isVisible()
        if (!isVisible) {
          return
        }
        await expect(panel).toBeVisible()
        const closeButton = page.locator('[aria-label^="Hide Panel"]')
        await closeButton.click()
        await expect(panel).toBeHidden()
        const focusedGroup = page.locator('.editor-group-container:focus-within')
        await expect(focusedGroup).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to hide panel`)
      }
    },
    async openTabsContextMenu() {
      try {
        const panelTabs = page.locator('.part.panel > .title > .composite-bar-container > .composite-bar')
        await expect(panelTabs).toBeVisible()
        const contextMenu = ContextMenu.create({ electronApp, expect, ideVersion, page, platform, VError })
        await contextMenu.open(panelTabs)
      } catch (error) {
        throw new VError(error, `Failed to open panel tabs context menu`)
      }
    },
    async show() {
      try {
        const panel = page.locator('.part.panel')
        const isVisible = await panel.isVisible()
        if (isVisible) {
          await expect(panel).toBeVisible()
          return
        }
        await expect(panel).toBeHidden()
        await this.toggle()
        await expect(panel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show panel`)
      }
    },
    async shouldShowIcons() {
      try {
        const activePanelTab = page.locator('.part.panel > .title > .composite-bar-container .action-item.checked.icon')
        await expect(activePanelTab).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify that panel tabs show icons`)
      }
    },
    async shouldShowLabels() {
      try {
        const activePanelTab = page.locator('.part.panel > .title > .composite-bar-container .action-item.checked:not(.icon)')
        await expect(activePanelTab).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify that panel tabs show labels`)
      }
    },
    async toggle() {
      try {
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.TogglePanelVisibilty)
      } catch (error) {
        throw new VError(error, `Failed to toggle panel`)
      }
    },
  }
}
