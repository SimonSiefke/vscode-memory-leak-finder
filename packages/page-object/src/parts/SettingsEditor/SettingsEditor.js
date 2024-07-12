import * as Settings from '../Settings/Settings.js'
import * as QuickPick from '../QuickPick/QuickPick.js'

const RE_LIST_ID = /(list_id_\d+)/

const getListIdFromClassName = (className) => {
  const match = className.match(RE_LIST_ID)
  if (!match) {
    throw new Error('no list id match')
  }
  return match[0]
}

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      const settings = Settings.create({ expect, page, VError })
      await settings.open()
    },
    async scrollDown() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.settings-editor-tree .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in settings editor`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.settings-editor-tree .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollUp()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in settings editor`)
      }
    },
    async search({ value, resultCount }) {
      try {
        await page.waitForIdle()
        const searchInput = page.locator('.search-container [role="textbox"]')
        await expect(searchInput).toBeFocused()
        await searchInput.type(value)
        await page.waitForIdle()
        const searchCount = page.locator('.settings-count-widget')
        const word = resultCount === 1 ? 'Setting' : 'Settings'
        await expect(searchCount).toHaveText(`${resultCount} ${word} Found`)
      } catch (error) {
        throw new VError(error, `Failed to search for ${value}`)
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
    async toggleCheckBox({ name }) {
      try {
        await page.waitForIdle()
        const checkbox = page.locator(`.monaco-custom-toggle[aria-label="${name}"]`)
        await expect(checkbox).toBeVisible()
        const checkedValue = await checkbox.getAttribute('aria-checked')
        const nextValue = checkedValue === 'true' ? 'false' : 'true'
        await checkbox.click()
        await expect(checkbox).toHaveAttribute('aria-checked', nextValue)
      } catch (error) {
        throw new VError(error, `Failed to toggle checkbox "${name}"`)
      }
    },
    async enableCheckBox({ name }) {
      try {
        await page.waitForIdle()
        const checkbox = page.locator(`.monaco-custom-toggle[aria-label="${name}"]`)
        await expect(checkbox).toBeVisible()
        const checkedValue = checkbox.getAttribute('aria-checked')
        if (checkedValue === 'true') {
          return
        }
        await this.toggleCheckBox({ name })
      } catch (error) {
        throw new VError(error, `Failed to enable checkbox "${name}"`)
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
    async openSettingsContextMenu(name) {
      try {
        await page.waitForIdle()
        const item = page.locator(`.setting-item-category`, {
          hasText: `${name}: `,
        })
        await expect(item).toBeVisible()
        await item.click()
        await page.waitForIdle()
        const outerItem = page.locator(`.settings-editor-tree .monaco-list-row[aria-label^="${name}"]`)
        await expect(outerItem).toHaveCount(1)
        await expect(outerItem).toHaveAttribute('aria-selected', 'true')
        await page.waitForIdle()
        const moreActions = outerItem.locator('[aria-label^="More Actions"]')
        await expect(moreActions).toBeVisible()
        await moreActions.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open settings context menu for "${name}"`)
      }
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
    async ensureIdle() {
      // create random quickpick to avoid race condition
      const quickPick = QuickPick.create({ page, expect, VError })
      await quickPick.show()
      await quickPick.hide()
    },
    async addItem({ name, key, value }) {
      try {
        await page.waitForIdle()
        const block = page.locator(`.setting-item-contents[aria-label="${name}"]`)
        await expect(block).toBeVisible()
        const keyHeading = block.locator('.setting-list-object-key')
        await expect(keyHeading).toHaveText('Item')
        const valueHeading = block.locator('.setting-list-object-value')
        await expect(valueHeading).toHaveText('Value')
        const addButton = block.locator('.monaco-button', {
          hasText: 'Add Item',
        })
        await addButton.click()
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
        throw new VError(error, `Failed to add item`)
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
  }
}
