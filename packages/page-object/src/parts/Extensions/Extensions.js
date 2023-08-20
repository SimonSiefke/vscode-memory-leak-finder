import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as ContextMenu from '../ContextMenu/ContextMenu.js'

export const create = ({ expect, page, VError }) => {
  return {
    async search(value) {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`)
        await expect(extensionsView).toBeVisible()
        const extensionsInput = extensionsView.locator('.inputarea')
        await expect(extensionsInput).toBeFocused()
        const lines = extensionsView.locator('.monaco-editor .view-lines')
        await page.keyboard.press('Control+A')
        await page.keyboard.press('Backspace')
        await expect(lines).toHaveText('', {
          timeout: 3000,
        })
        await extensionsInput.type(value)
      } catch (error) {
        throw new VError(error, `Failed to search for ${value}`)
      }
    },
    async show() {
      try {
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.ShowExtensions)
        const extensionsView = page.locator(`.extensions-viewlet`)
        await expect(extensionsView).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show extensions view`)
      }
    },
    async hide() {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`)
        await expect(extensionsView).toBeVisible()
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.TogglePrimarySideBarVisibility)
        await expect(extensionsView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide extensions view`)
      }
    },
    async openSuggest() {
      try {
        const extensionsView = page.locator('.extensions-viewlet')
        const extensionsInput = extensionsView.locator('.inputarea')
        await expect(extensionsInput).toBeFocused()
        await extensionsInput.press('Control+Space')
        // TODO scope selector to extensions view
        const suggestions = page.locator('[aria-label="Suggest"]')
        await expect(suggestions).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to open extensions suggestions`)
      }
    },
    async closeSuggest() {
      try {
        // TODO scope selector to extensions view
        const suggestions = page.locator('[aria-label="Suggest"]')
        await expect(suggestions).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(suggestions).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close extensions suggestions`)
      }
    },
    first: {
      async shouldBe(name) {
        const firstExtension = page.locator('.extension-list-item').first()
        await expect(firstExtension).toBeVisible({
          timeout: 3000,
        })
        const nameLocator = firstExtension.locator('.name')
        await expect(nameLocator).toHaveText(name)
      },
      async click() {
        // TODO select by data index
        const firstExtension = page.locator('.extension-list-item').first()
        await expect(firstExtension).toBeVisible()
        const nameLocator = firstExtension.locator('.name')
        const name = await nameLocator.textContent()
        await expect(nameLocator).toHaveText(name)
        await firstExtension.click()
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        const heading = extensionEditor.locator('.name').first()
        await expect(heading).toHaveText(name)
      },
      async openContextMenu() {
        const firstExtension = page.locator('.extension-list-item').first()
        await expect(firstExtension).toBeVisible()
        const nameLocator = firstExtension.locator('.name')
        const name = await nameLocator.textContent()
        await expect(nameLocator).toHaveText(name)
        const contextMenu = ContextMenu.create({ page, expect, VError })
        await contextMenu.open(firstExtension)
        await contextMenu.close()
      },
    },
  }
}
