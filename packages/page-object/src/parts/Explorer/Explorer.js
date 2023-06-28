const RE_NUMER_AT_END = /\d+$/

const getNextActiveDescendant = (listId, activeDescendant) => {
  // TODO list id can be dynamic
  if (activeDescendant === null) {
    return `${listId}_0`
  }
  const match = activeDescendant.match(RE_NUMER_AT_END)
  if (!match) {
    throw new Error(`Failed to parse active descendant ${activeDescendant}`)
  }
  const number = parseInt(match[0])
  return `${listId}_${number + 1}`
}

const getListId = (classNameString) => {
  if (typeof classNameString !== 'string') {
    throw new Error(`className must be of type string`)
  }
  const classNames = classNameString.split(' ')
  for (const className of classNames) {
    if (className.startsWith('list_id')) {
      return className
    }
  }
  throw new Error(`Failed to extract list id from explorer`)
}

// TODO avoid using timeout
const SHORT_TIMEOUT = 250

export const create = ({ page, expect, VError }) => {
  return {
    async focus() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: 'Control+Shift+P',
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible()
        const quickPickInput = quickPick.locator('[role="combobox"]')
        await quickPickInput.type('Focus Explorer')
        const firstOption = quickPick.locator('.monaco-list-row').first()
        await firstOption.click()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        await expect(explorer).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to focus explorer`)
      }
    },
    async focusNext() {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const current = await explorer.getAttribute('aria-activedescendant')
        const className = await explorer.getAttribute('class')
        const listId = getListId(className)
        const next = getNextActiveDescendant(listId, current)
        await page.keyboard.press('ArrowDown')
        expect(await explorer.getAttribute('aria-activedescendant')).toBe(next)
      } catch (error) {
        throw new VError(error, `Failed to focus next item in explorer`)
      }
    },
    async click() {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        await explorer.click()
      } catch (error) {
        throw new VError(error, `Failed to click into explorer`)
      }
    },
    async expand(folderName) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const folder = explorer.locator('.monaco-list-row', {
          hasText: folderName,
        })
        // TODO verify that folder has aria-expanded=false
        await folder.click()
      } catch (error) {
        throw new VError(error, `Failed to expand explorer folder`)
      }
    },
    async collapse(folderName) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const folder = explorer.locator('.monaco-list-row', {
          hasText: folderName,
        })
        // TODO verify that folder has aria-expanded=false
        await folder.click()
      } catch (error) {
        throw new VError(error, `Failed to expand explorer folder`)
      }
    },
    async shouldHaveItem(direntName) {
      return this.toHaveItem(direntName)
    },
    async toHaveItem(direntName) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const dirent = explorer.locator('.monaco-list-row', {
          hasText: direntName,
        })
        await expect(dirent).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify that explorer has dirent ${direntName}`)
      }
    },
    async shouldHaveFocusedItem(direntName) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const dirent = explorer.locator('.monaco-list-row', {
          hasText: direntName,
        })
        await expect(dirent).toBeVisible()
        const id = await dirent.getAttribute('id')
        await expect(explorer).toHaveAttribute('aria-activedescendant', id)
      } catch (error) {
        throw new VError(error, `Failed to verify that explorer has dirent ${direntName}`)
      }
    },
    async copy(dirent) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: dirent,
        })
        await expect(oldDirent).toBeVisible()
        await oldDirent.click({
          button: 'right',
        })
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeVisible()
        await expect(contextMenu).toBeFocused()
        const contextMenuItemCopy = contextMenu
          .locator('.action-item', {
            hasText: 'Copy',
          })
          .first()
        await page.waitForTimeout(SHORT_TIMEOUT)
        await contextMenuItemCopy.click()
      } catch (error) {
        throw new VError(error, `Failed to copy explorer item ${dirent}`)
      }
    },
    async openContextMenu(dirent, select) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: dirent,
        })
        await expect(oldDirent).toBeVisible()
        await oldDirent.click({
          button: 'right',
        })
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeVisible()
        await expect(contextMenu).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open context menu for ${dirent}`)
      }
    },
    async paste() {
      try {
        await page.keyboard.press('Control+V')
      } catch (error) {
        throw new VError(error, `Failed to paste`)
      }
    },
    async delete(item) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: item,
        })
        await expect(oldDirent).toBeVisible()
        await page.keyboard.press('Delete')
        await expect(oldDirent).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to delete`)
      }
    },
    async rename(oldDirentName, newDirentName) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: oldDirentName,
        })
        await expect(oldDirent).toBeVisible()
        await oldDirent.click({
          button: 'right',
        })
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeVisible()
        await expect(contextMenu).toBeFocused()
        const contextMenuItemRename = contextMenu.locator('.action-item', {
          hasText: 'Rename',
        })
        await page.waitForTimeout(SHORT_TIMEOUT)
        await contextMenuItemRename.click()
        const input = explorer.locator('input')
        await input.selectText()
        await input.type(newDirentName)
        await input.press('Enter')
        await expect(oldDirent).toBeHidden()
        const newDirent = explorer.locator(`text=${newDirentName}`)
        await expect(newDirent).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to rename explorer item from ${oldDirentName} to ${newDirentName}`)
      }
    },
    not: {
      async toHaveItem(direntName) {
        try {
          const explorer = page.locator('.explorer-folders-view .monaco-list')
          const dirent = explorer.locator('.monaco-list-row', {
            hasText: direntName,
          })
          await expect(dirent).not.toBeVisible()
        } catch (error) {
          throw new VError(error, `Failed to verify that explorer doesn't have dirent ${direntName}`)
        }
      },
    },
  }
}
