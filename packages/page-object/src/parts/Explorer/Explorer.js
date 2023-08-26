import * as ContextMenu from '../ContextMenu/ContextMenu.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WaitForIdle from '../WaitForIdle/WaitForIdle.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

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

export const create = ({ page, expect, VError }) => {
  return {
    async focus() {
      try {
        await WaitForIdle.waitForIdle(page)
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.FocusExplorer)
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
        await expect(explorer).toHaveAttribute('aria-activedescendant', next)
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
    async collapseAll() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.CollapseFoldersInExplorer)
      } catch (error) {
        throw new VError(error, `Failed to collapse all`)
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
        throw new VError(error, `Failed to verify that explorer has dirent "${direntName}"`)
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
        throw new VError(error, `Failed to verify that explorer has focused dirent "${direntName}"`)
      }
    },
    async copy(dirent) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: dirent,
        })
        await expect(oldDirent).toBeVisible()
        await this.executeContextMenuCommand(oldDirent, 'Copy')
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
        await WaitForIdle.waitForIdle(page)
        await oldDirent.click({
          button: 'right',
        })
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeVisible()
        await expect(contextMenu).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open context menu for "${dirent}"`)
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
        throw new VError(error, `Failed to delete ${item}`)
      }
    },
    async executeContextMenuCommand(locator, option) {
      await WaitForIdle.waitForIdle(page)
      const contextMenu = ContextMenu.create({ expect, page, VError })
      await WaitForIdle.waitForIdle(page)
      await contextMenu.open(locator)
      await WaitForIdle.waitForIdle(page)
      await contextMenu.select(option)
      await WaitForIdle.waitForIdle(page)
    },
    async rename(oldDirentName, newDirentName) {
      try {
        await WaitForIdle.waitForIdle(page)
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: oldDirentName,
        })
        await expect(oldDirent).toBeVisible()
        await WaitForIdle.waitForIdle(page)
        await this.executeContextMenuCommand(oldDirent, 'Rename...')
        await WaitForIdle.waitForIdle(page)
        const input = explorer.locator('input')
        await expect(input).toBeVisible({ timeout: 5000 })
        await input.selectText()
        await input.type(newDirentName)
        await input.press('Enter')
        await expect(oldDirent).toBeHidden()
        const newDirent = explorer.locator(`text=${newDirentName}`)
        await expect(newDirent).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to rename explorer item from "${oldDirentName}" to "${newDirentName}"`)
      }
    },
    async refresh() {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        await expect(explorer).toBeVisible()
        const header = page.locator(`.pane-header[aria-label^="Explorer Section"]`)
        await expect(header).toBeVisible()
        await header.hover()
        const button = page.locator(`[role="button"][aria-label="Refresh Explorer"]`)
        await button.click()
      } catch (error) {
        throw new VError(error, `Failed to refresh explorer`)
      }
    },
    not: {
      async toHaveItem(direntName) {
        try {
          const explorer = page.locator('.explorer-folders-view .monaco-list')
          const dirent = explorer.locator('.monaco-list-row', {
            hasText: direntName,
          })
          await expect(dirent).toBeHidden()
        } catch (error) {
          throw new VError(error, `Failed to verify that explorer doesn't have dirent ${direntName}`)
        }
      },
    },
  }
}
