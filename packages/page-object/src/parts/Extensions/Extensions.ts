import { cp } from 'fs/promises'
import { basename, join } from 'path'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as IsMacos from '../IsMacos/IsMacos.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const selectAll = IsMacos.isMacos ? 'Meta+A' : 'Control+A'

const space = ' '
const nonBreakingSpace = String.fromCharCode(160)

export const create = ({ expect, page, VError, ideVersion }) => {
  return {
    async search(value) {
      try {
        await page.waitForIdle()
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
    async add(path, expectedName) {
      try {
        // TODO could create symlink also
        const absolutePath = join(Root.root, path)
        const base = basename(absolutePath)
        const destination = join(Root.root, '.vscode-extensions', base)
        await cp(absolutePath, destination, { recursive: true, force: true })
        await page.waitForIdle()
        await this.show()
        await page.waitForIdle()
        await this.search('@installed')
        await page.waitForIdle()
        const firstExtension = page.locator('.extension-list-item').first()
        await expect(firstExtension).toBeVisible()
        const nameLocator = firstExtension.locator('.name')
        await expect(nameLocator).toHaveText(expectedName)
        await page.waitForIdle()
        await this.hide()
      } catch (error) {
        throw new VError(error, `Failed to add extension`)
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
    async shouldHaveMcpItem({ name }) {
      try {
        const paneHeader = page.locator('[aria-label="MCP Servers - Installed Section"]')
        await expect(paneHeader).toBeVisible()
        const list = page.locator('.monaco-list[aria-label="MCP Servers"]')
        await expect(list).toBeVisible()
        const item = list.locator(`[aria-label="${name}"]`)
        await expect(item).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify that mcp item is visible ${name}`)
      }
    },
    async selectMcpItem({ name }) {
      try {
        const list = page.locator('.monaco-list[aria-label="MCP Servers"]')
        await expect(list).toBeVisible()
        const item = list.locator(`[aria-label="${name}"]`)
        await expect(item).toBeVisible()
        await item.click()
        const editor = page.locator('.part.editor')
        await expect(editor).toBeVisible()
        const tab = page.locator('.tab[aria-label="MCP Server: my-advanced-mcp-server"]')
        await expect(tab).toBeVisible()
        const mcpEditor = page.locator('.extension-editor.mcp-server-editor')
        await expect(mcpEditor).toBeVisible()
        const configuration = mcpEditor.locator('.configuration')
        await expect(configuration).toBeVisible()
        const firstItem = configuration.locator('.config-section').nth(0)
        const firstItemLabel = firstItem.locator('.config-label')
        const firstItemValue = firstItem.locator('.config-value')
        await expect(firstItemLabel).toHaveText('Name:')
        await expect(firstItemValue).toHaveText('my-advanced-mcp-server')
        const secondItem = configuration.locator('.config-section').nth(1)
        const secondItemLabel = secondItem.locator('.config-label')
        const secondItemValue = secondItem.locator('.config-value')
        await expect(secondItemLabel).toHaveText('Type:')
        await expect(secondItemValue).toHaveText('http')
      } catch (error) {
        throw new VError(error, `Failed select item ${name}`)
      }
    },
    async show() {
      try {
        await page.waitForIdle()
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
          await page.waitForIdle()
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
            await page.waitForIdle()
            await expect(extensionsInput).toBeVisible()
            await page.waitForIdle()
            await extensionsInput.click()
            await page.waitForIdle()
          }
          await extensionsInput.focus()
          await page.waitForIdle()
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
        const extensionsInput = extensionsView.locator('.native-edit-context')
        await expect(extensionsInput).toBeFocused()
        const suggestions = page.locator('[aria-label="Suggest"]')
        for (let i = 0; i < 5; i++) {
          await page.waitForIdle()
          const count = await suggestions.count()
          if (count > 0) {
            break
          }
          await extensionsInput.press('Control+Space')
        }
        await page.waitForIdle()
        // TODO scope selector to extensions view
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
    async restart(expectedText) {
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
