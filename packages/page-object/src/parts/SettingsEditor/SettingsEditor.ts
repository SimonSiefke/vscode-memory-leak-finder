import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Settings from '../Settings/Settings.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async addItem({ key, name, value }) {
      try {
        await page.waitForIdle()
        const block = page.locator(`.setting-item-contents[aria-label="${name}"]`)
        await expect(block).toBeVisible()
        await page.waitForIdle()
        const keyHeading = block.locator('.setting-list-object-key')
        await expect(keyHeading).toHaveText('Item')
        await page.waitForIdle()
        const valueHeading = block.locator('.setting-list-object-value')
        await expect(valueHeading).toHaveText('Value')
        await page.waitForIdle()
        const addButton = block.locator('.monaco-button', {
          hasText: 'Add Item',
        })
        await addButton.click()
        await page.waitForIdle()
        const keyInput = block.locator('.setting-list-object-input-key .input')
        await expect(keyInput).toBeVisible()
        await expect(keyInput).toBeFocused()
        await keyInput.type(key)
        const valueInput = block.locator('.setting-list-object-input-value .input')
        await expect(valueInput).toBeVisible()
        await valueInput.focus()
        await valueInput.type(value)
        const okButton = block.locator('.setting-list-ok-button')
        await expect(okButton).toBeVisible()
        await okButton.click()
        const row = block.locator('.setting-list-object-row')
        await expect(row).toHaveCount(1)
        await expect(row).toHaveAttribute('aria-label', `The property \`${key}\` is set to \`${value}\`.`)
      } catch (error) {
        throw new VError(error, `Failed to add item to settings editor`)
      }
    },
    async applyFilter({ filterName, filterText }) {
      try {
        await page.waitForIdle()
        const settingsFilter = page.locator('[aria-label="Filter Settings"]')
        await settingsFilter.click()
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({
          expect,
          page,
          VError,
        })
        await contextMenu.shouldHaveItem(filterName)
        await contextMenu.select(filterName)
      } catch (error) {
        throw new VError(error, `Failed to apply filter ${filterName}`)
      }
    },
    async clear() {
      try {
        await page.waitForIdle()
        const searchInput = page.locator('.search-container [role="textbox"]')
        await expect(searchInput).toBeFocused()
        const clearButton = page.locator('[aria-label="Clear Settings Search Input"]')
        await clearButton.click()
        await page.waitForIdle()
        await expect(searchInput).toHaveValue('')
        const searchCount = page.locator('.settings-count-widget')
        await expect(searchCount).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to clear search input`)
      }
    },
    async closeSettingsContextMenu(name) {
      try {
        await page.waitForIdle()
        const outerItem = page.locator(`.settings-editor-tree .monaco-list-row[aria-label^="${name}"]`)
        await expect(outerItem).toBeVisible()
        const contextMenu = outerItem.locator('.setting-toolbar-container .shadow-root-host:enter-shadow() .context-view')
        await expect(contextMenu).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(contextMenu).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close settings context menu for "${name}"`)
      }
    },
    async collapse(groupName) {
      try {
        const group = page.locator(`[aria-label="${groupName}, group"]`)
        await expect(group).toBeVisible()
        await expect(group).toHaveAttribute('aria-expanded', 'true')
        await group.click()
        await expect(group).toHaveAttribute('aria-expanded', 'false')
      } catch (error) {
        throw new VError(error, `Failed to collapse ${groupName}`)
      }
    },
    async collapseOutline() {
      try {
        await page.waitForIdle()
        const tableOfContents = page.locator('[aria-label="Settings Table of Contents"]')
        await expect(tableOfContents).toBeVisible()
        await tableOfContents.focus()
        await page.keyboard.press('Control+ArrowLeft')
        const expandedItems = tableOfContents.locator('[aria-expanded="true"]')
        await expect(expandedItems).toHaveCount(0)
      } catch (error) {
        throw new VError(error, `Failed to collapse outline`)
      }
    },
    async disableCheckBox({ name }) {
      try {
        await page.waitForIdle()
        const checkbox = page.locator(`.monaco-custom-toggle[aria-label="${name}"]`)
        await expect(checkbox).toBeVisible()
        const checkedValue = checkbox.getAttribute('aria-checked')
        if (checkedValue === 'false') {
          return
        }
        await this.toggleCheckBox({ name })
      } catch (error) {
        throw new VError(error, `Failed to disable checkbox "${name}"`)
      }
    },
    async enableCheckBox({ name }) {
      try {
        await page.waitForIdle()
        const checkbox = page.locator(`.monaco-custom-toggle[aria-label="${name}"]`)
        await expect(checkbox).toBeVisible()
        await page.waitForIdle()
        const checkedValue = await checkbox.getAttribute('aria-checked')
        if (checkedValue === 'true') {
          return
        }
        await this.toggleCheckBox({ name })
      } catch (error) {
        throw new VError(error, `Failed to enable checkbox "${name}"`)
      }
    },
    async ensureIdle() {
      // TODO maybe find a better way
      // create random quickpick to avoid race condition
      await page.waitForIdle()
      const quickPick = QuickPick.create({ expect, page, VError })
      await quickPick.show()
      await quickPick.hide()
      await page.waitForIdle()
    },
    async expand(groupName) {
      try {
        const group = page.locator(`[aria-label="${groupName}, group"]`)
        await expect(group).toBeVisible()
        await expect(group).toHaveAttribute('aria-expanded', 'false')
        await group.click()
        await expect(group).toHaveAttribute('aria-expanded', 'true')
      } catch (error) {
        throw new VError(error, `Failed to expand ${groupName}`)
      }
    },
    async focusOutline(name) {
      try {
        await page.waitForIdle()
        const tableOfContents = page.locator('[aria-label="Settings Table of Contents"]')
        await expect(tableOfContents).toBeVisible()
        const item = page.locator(`[aria-label="${name}, group"]`)
        await item.click({
          button: 'right',
        })
        const heading = page.locator('.settings-group-level-1').nth(0)
        await expect(heading).toBeVisible()
        await expect(heading).toHaveText(name)
      } catch (error) {
        throw new VError(error, `Failed to focus outline item`)
      }
    },
    async moveScrollBar(y: number, expectedScrollBarTop: number) {
      try {
        await page.waitForIdle()
        await page.mouse.mockPointerEvents()
        const tree = page.locator('.settings-tree-container')
        await expect(tree).toBeVisible()
        await page.waitForIdle()
        const scrollbar = tree.locator('.scrollbar.vertical').first()
        await page.waitForIdle()
        await scrollbar.hover()
        await page.waitForIdle()
        const scrollBarVisible = tree.locator('.scrollbar.visible.scrollbar.vertical')
        await expect(scrollBarVisible).toBeVisible()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        const scrollbarSlider = scrollbar.locator('.slider')
        await expect(scrollbarSlider).toBeVisible()
        await page.waitForIdle()
        const elementBox1 = await scrollbarSlider.boundingBox()
        if (!elementBox1) {
          throw new Error('Unable to find bounding box on element')
        }

        const elementCenterX = elementBox1.x + elementBox1.width / 2
        const elementCenterY = elementBox1.y + elementBox1.height / 2

        const xOffset = 0
        const yOffset = y

        await page.waitForIdle()
        await scrollbarSlider.hover()
        await page.waitForIdle()
        await page.mouse.move(elementCenterX, elementCenterY)
        await page.waitForIdle()
        await page.mouse.down()
        await page.waitForIdle()

        await expect(scrollbarSlider).toHaveClass('slider active')
        await page.waitForIdle()
        await page.mouse.move(elementCenterX + xOffset, elementCenterY + yOffset)
        await page.waitForIdle()
        await page.mouse.up()
        await page.waitForIdle()
        await expect(scrollbarSlider).toHaveCss('top', `${expectedScrollBarTop}px`)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in settings editor`)
      }
    },
    async open() {
      const settings = Settings.create({ expect, page, VError })
      await settings.open()
    },
    async openSettingsContextMenu(name, { waitForItem }) {
      try {
        await page.waitForIdle()
        const item = page.locator(`.setting-item-category`, {
          hasText: `${name}: `,
        })
        await expect(item).toBeVisible()
        await page.waitForIdle()
        await item.click()
        await page.waitForIdle()
        const outerItem = page.locator(`.settings-editor-tree .monaco-list-row[aria-label^="${name}"]`)
        await expect(outerItem).toHaveCount(1)
        await expect(outerItem).toHaveAttribute('aria-selected', 'true')
        await page.waitForIdle()
        const moreActions = outerItem.locator('[aria-label^="More Actions"]')
        await expect(moreActions).toBeVisible()
        await page.waitForIdle()
        await moreActions.click()
        await page.waitForIdle()
        const contextMenu = outerItem.locator('.setting-toolbar-container .shadow-root-host:enter-shadow() .context-view')
        await expect(contextMenu).toBeVisible()
        const contextMenuItem = contextMenu.locator(`.action-label[aria-label="${waitForItem}"]`)
        await expect(contextMenuItem).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to open settings context menu for "${name}"`)
      }
    },
    async openTab(tabName) {
      try {
        const settingsSwitcher = page.locator('[aria-label="Settings Switcher"]')
        await expect(settingsSwitcher).toBeVisible()
        const tab = settingsSwitcher.locator(`[aria-label="${tabName}"]`)
        await expect(tab).toBeVisible()
        await expect(tab).toHaveAttribute('aria-selected', 'false')
        await tab.click()
        await page.waitForIdle()
        await expect(tab).toHaveAttribute('aria-selected', 'true')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open tab "${tabName}"`)
      }
    },
    async removeItem({ name }) {
      try {
        await page.waitForIdle()
        const block = page.locator(`.setting-item-contents[aria-label="${name}"]`)
        await expect(block).toBeVisible()
        const row = block.locator('.setting-list-object-row')
        await expect(row).toHaveCount(1)
        await row.click()
        const removeButton = row.locator('[aria-label="Remove Item"]')
        await removeButton.click()
        await expect(row).toHaveCount(0)
      } catch (error) {
        throw new VError(error, `Failed to remove item`)
      }
    },
    async search({ resultCount, value }) {
      try {
        await page.waitForIdle()
        const searchInput = page.locator('.search-container [role="textbox"]')
        await expect(searchInput).toBeVisible()
        await page.waitForIdle()
        await expect(searchInput).toBeFocused()
        await page.waitForIdle()
        await searchInput.type(value)
        await page.waitForIdle()
        const searchCount = page.locator('.settings-count-widget')
        const word = resultCount === 1 ? 'Setting' : 'Settings'
        await expect(searchCount).toBeVisible()
        await page.waitForIdle()
        await expect(searchCount).toHaveText(`${resultCount} ${word} Found`)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to search for ${value}`)
      }
    },
    async select({ name, value }) {
      try {
        await page.waitForIdle()
        const select = page.locator(`.monaco-select-box[aria-label="${name}"]`)
        await expect(select).toBeVisible()
        await select.click()
        await page.waitForIdle()
        const dropdown = page.locator('.monaco-select-box-dropdown-container')
        await expect(dropdown).toBeVisible()
        const option = dropdown.locator('[role="option"]', {
          hasText: value,
        })
        await option.click()
      } catch (error) {
        throw new VError(error, `Failed to open select`)
      }
    },
    async setTextInput({ name, value }) {
      try {
        await page.waitForIdle()
        const settingItem = page.locator(`.setting-item-contents[data-key="${name}"]`)
        await expect(settingItem).toBeVisible()
        await page.waitForIdle()
        const input = settingItem.locator('input[type="text"]')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        await input.click()
        await page.waitForIdle()
        await input.focus()
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await input.type(value)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set text input for ${name}`)
      }
    },
    async toggleCheckBox({ name }) {
      try {
        await page.waitForIdle()
        const checkbox = page.locator(`.monaco-custom-toggle[aria-label="${name}"]`)
        await expect(checkbox).toBeVisible()
        await page.waitForIdle()
        const checkedValue = await checkbox.getAttribute('aria-checked')
        const nextValue = checkedValue === 'true' ? 'false' : 'true'
        await checkbox.click()
        await page.waitForIdle()
        await expect(checkbox).toHaveAttribute('aria-checked', nextValue)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle checkbox "${name}"`)
      }
    },
  }
}
