import * as ContextMenu from '../ContextMenu/ContextMenu.js'
import * as IsMacos from '../IsMacos/IsMacos.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

const selectAll = IsMacos.isMacos ? 'Meta+A' : 'Control+A'

const space = ' '
const nonBreakingSpace = String.fromCharCode(160)

export const create = ({ expect, page, VError, ideVersion }) => {
  return {
    async search(value) {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`)
        await expect(extensionsView).toBeVisible()
        if (ideVersion && ideVersion.minor <= 100) {
          const extensionsInput = extensionsView.locator('.inputarea')
          await expect(extensionsInput).toBeFocused()
          await extensionsInput.setValue('')
        } else {
          const extensionsInput = extensionsView.locator('.native-edit-context')
          await expect(extensionsInput).toBeFocused()
          await extensionsInput.setValue('')
        }
        const lines = extensionsView.locator('.monaco-editor .view-lines')
        await page.keyboard.press(selectAll)
        await page.keyboard.press('Backspace')
        await expect(lines).toHaveText('', {
          timeout: 3000,
        })
        if (ideVersion && ideVersion.minor <= 100) {
          const extensionsInput = extensionsView.locator('.inputarea')
          await extensionsInput.type(value)
        } else {
          const extensionsInput = extensionsView.locator('.native-edit-context')
          await extensionsInput.type(value)
        }
      } catch (error) {
        throw new VError(error, `Failed to search for ${value}`)
      }
    },
    async clear() {
      try {
        const clearButton = page.locator('[aria-label="Clear Extensions Search Results"]')
        await clearButton.click()
        await this.shouldHaveValue('')
      } catch (error) {
        throw new VError(error, `Failed to clear`)
      }
    },
    async shouldHaveValue(value) {
      try {
        const extensionsView = page.locator(`.extensions-viewlet`)
        await expect(extensionsView).toBeVisible()
        const extensionsInputElement = page.locator('.extensions-search-container .view-lines')
        const actualText = value.replaceAll(space, nonBreakingSpace)
        await expect(extensionsInputElement).toHaveText(actualText)
      } catch (error) {
        throw new VError(error, `Failed to verify that extension input has value ${value}`)
      }
    },
    async show() {
      try {
        const searchItem = page.locator(`.action-item:has([aria-label^="Extensions"])`)
        const selected = await searchItem.getAttribute('aria-selected')
        if (selected !== 'true') {
          const quickPick = QuickPick.create({
            page,
            expect,
            VError,
          })
          await quickPick.executeCommand(WellKnownCommands.ShowExtensions)
          const extensionsView = page.locator(`.extensions-viewlet`)
          await expect(extensionsView).toBeVisible()
        }
        const extensionsView = page.locator(`.extensions-viewlet`)
        const suggestContainer = page.locator(`.suggest-input-container`)
        if (ideVersion && ideVersion.minor <= 100) {
          const extensionsInput = extensionsView.locator('.inputarea')
          const className = await suggestContainer.getAttribute('class')
          if (!className.includes('synthetic-focus')) {
            await suggestContainer.click()
            await expect(extensionsInput).toBeVisible()
            await extensionsInput.click()
          }
          await extensionsInput.focus()
          await expect(suggestContainer).toHaveClass('synthetic-focus')
          await expect(extensionsInput).toBeFocused()
          await page.waitForIdle()
        } else {
          const extensionsInput = extensionsView.locator('.native-edit-context')
          const className = await suggestContainer.getAttribute('class')
          if (!className.includes('synthetic-focus')) {
            await suggestContainer.click()
            await expect(extensionsInput).toBeVisible()
            await extensionsInput.click()
          }
          await extensionsInput.focus()
          await expect(suggestContainer).toHaveClass('synthetic-focus')
          await expect(extensionsInput).toBeFocused()
          await page.waitForIdle()
        }
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
        await page.waitForIdle()
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
    async shouldHaveMcpWelcomeHeading(expectedText) {
      try {
        const mcpWelcomeTitle = page.locator('.mcp-welcome-title')
        await expect(mcpWelcomeTitle).toBeVisible()
        await expect(mcpWelcomeTitle).toHaveText(expectedText)
      } catch (error) {
        throw new VError(error, `Failed to check mcp welcome heading`)
      }
    },
    async shouldHaveTitle(expectedTtitle) {
      try {
        const title = page.locator('.sidebar .title-label h2')
        await expect(title).toBeVisible()
        await expect(title).toHaveText(expectedTtitle)
      } catch (error) {
        throw new VError(error, `Failed to check extensions title`)
      }
    },
    first: {
      async shouldBe(name) {
        const firstExtension = page.locator('.extension-list-item').first()
        await expect(firstExtension).toBeVisible({
          timeout: 7000,
        })
        const nameLocator = firstExtension.locator('.name')
        await expect(nameLocator).toHaveText(name)
        await page.waitForIdle()
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
        await page.waitForIdle()
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
