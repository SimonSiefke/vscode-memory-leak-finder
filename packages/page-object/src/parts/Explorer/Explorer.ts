import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Electron from '../Electron/Electron.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const RE_NUMER_AT_END = /\d+$/

const getNextActiveDescendant = (listId: string, activeDescendant: string | null) => {
  // TODO list id can be dynamic
  if (activeDescendant === null) {
    return `${listId}_0`
  }
  const match = activeDescendant.match(RE_NUMER_AT_END)
  if (!match) {
    throw new Error(`Failed to parse active descendant ${activeDescendant}`)
  }
  const number = Number.parseInt(match[0])
  return `${listId}_${number + 1}`
}

const getListId = (classNameString: string) => {
  if (typeof classNameString !== 'string') {
    throw new TypeError(`className must be of type string`)
  }
  const classNames = classNameString.split(' ')
  for (const className of classNames) {
    if (className.startsWith('list_id')) {
      return className
    }
  }
  throw new Error(`Failed to extract list id from explorer`)
}

import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ electronApp, expect, page, platform, VError }: CreateParams) => {
  return {
    async cancel() {
      try {
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        const inputBox = await page.locator('.monaco-inputbox input')
        await expect(inputBox).toBeHidden()
        const errorElement = page.locator('.monaco-inputbox-message.error')
        await expect(errorElement).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to cancel input`)
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
    async collapse(folderName: string) {
      try {
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const folder = explorer.locator('.monaco-list-row', {
          hasText: folderName,
        })
        await expect(folder).toBeVisible()
        await page.waitForIdle()
        await folder.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to collapse explorer folder`)
      }
    },
    async collapseAll() {
      try {
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.CollapseFoldersInExplorer)
      } catch (error) {
        throw new VError(error, `Failed to collapse all`)
      }
    },
    async copy(dirent: string) {
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
    async delete(item: string) {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        await electron.mockShellTrashItem()
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: item,
        })
        await expect(oldDirent).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Delete')
        await page.waitForIdle()
        await expect(oldDirent).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to delete ${item}`)
      }
    },
    async executeContextMenuCommand(locator: any, option: string) {
      await page.waitForIdle()
      const contextMenu = ContextMenu.create({ electronApp, expect, ideVersion, page, platform, VError })
      await page.waitForIdle()
      await contextMenu.open(locator)
      await page.waitForIdle()
      await contextMenu.select(option)
      await page.waitForIdle()
    },
    async expand(folderName: string) {
      try {
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const folder = explorer.locator(`.monaco-list-row[aria-label="${folderName}"]`)
        await expect(folder).toBeVisible()
        await page.waitForIdle()
        await folder.click()
        await page.waitForIdle()
        await expect(folder).toHaveAttribute('aria-expanded', 'true')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to expand explorer folder`)
      }
    },
    async focus() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.FocusExplorer)
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        await expect(explorer).toBeFocused()
        await page.waitForIdle()
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
    async newFile(name: string) {
      try {
        await page.waitForIdle()
        const newFileButton = page.locator('.sidebar [aria-label="New File..."]')
        await expect(newFileButton).toBeVisible()
        await page.waitForIdle()
        await newFileButton.click()
        await page.waitForIdle()
        const inputBox = await page.locator('.monaco-inputbox input')
        await expect(inputBox).toBeVisible()
        await page.waitForIdle()
        await expect(inputBox).toBeFocused()
        await inputBox.type(name)
        await page.keyboard.press('Enter')
        await this.shouldHaveItem(name)
      } catch (error) {
        throw new VError(error, `Failed to create new file`)
      }
    },
    async newFolder({ error, name }: { error: any; name: string }) {
      try {
        await page.waitForIdle()
        const newFolderButton = page.locator('.sidebar [aria-label="New Folder..."]')
        await expect(newFolderButton).toBeVisible()
        await newFolderButton.click()
        const inputBox = await page.locator('.monaco-inputbox input')
        await expect(inputBox).toBeVisible()
        await expect(inputBox).toBeFocused()
        if (name) {
          await inputBox.type(name)
        }
        await page.keyboard.press('Enter')
        if (error) {
          const errorElement = page.locator('.monaco-inputbox-message.error')
          await expect(errorElement).toBeVisible()
          await expect(errorElement).toHaveText(error)
        }
      } catch (error) {
        throw new VError(error, `Failed to create new folder`)
      }
    },
    not: {
      async toHaveItem(direntName: string) {
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
    async openAllFiles() {
      try {
        await page.waitForIdle()
        await page.keyboard.press('Control+A')
        await page.waitForIdle()
        await this.openContextMenu(`1.txt`)
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await contextMenu.select('Open to the Side')
        await page.waitForIdle()
        const quickPick = QuickPick.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.CloseOtherGroups)
        await page.waitForIdle()
        // TODO open context menu, the open to the side
        // then close left group
      } catch (error) {
        throw new VError(error, `Failed to open all files`)
      }
    },
    async openContextMenu(dirent: string, _select = undefined) {
      try {
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: dirent,
        })
        await expect(oldDirent).toBeVisible()
        await page.waitForIdle()
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
    async paste({ waitForItem = '' } = {}) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        await page.waitForIdle()
        await page.keyboard.press('Control+V')
        await page.waitForIdle()
        if (!waitForItem) {
          return
        }
        const dirent = explorer.locator('.monaco-list-row', {
          hasText: waitForItem,
        })
        for (let i = 0; i < 5; i++) {
          await page.waitForIdle()
          const count = await dirent.count()
          if (count > 0) {
            break
          }
        }
        await expect(dirent).toBeVisible()
        const id = await dirent.getAttribute('id')
        if (id) {
          await expect(explorer).toHaveAttribute('aria-activedescendant', id)
        }
      } catch (error) {
        throw new VError(error, `Failed to paste`)
      }
    },
    async refresh() {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        await electron.mockShellTrashItem()
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        await expect(explorer).toBeVisible()
        const header = page.locator(`.pane-header[aria-label^="Explorer Section"]`)
        await expect(header).toBeVisible()
        await header.hover()
        await page.waitForIdle()
        const button = page.locator(`[role="button"][aria-label="Refresh Explorer"]`)
        await button.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to refresh explorer`)
      }
    },
    async removeCurrent() {
      try {
        await page.waitForIdle()
        await page.keyboard.press('Home')
        await page.waitForIdle()
        await page.keyboard.press('Delete')
        await this.refresh()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to delete`)
      }
    },
    async rename(oldDirentName: string, newDirentName: string) {
      try {
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const oldDirent = explorer.locator('.monaco-list-row', {
          hasText: oldDirentName,
        })
        await expect(oldDirent).toBeVisible()
        await page.waitForIdle()
        await this.executeContextMenuCommand(oldDirent, 'Rename...')
        await page.waitForIdle()
        const input = explorer.locator('input')
        await expect(input).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
        await input.selectText()
        await page.waitForIdle()
        await input.type(newDirentName)
        await page.waitForIdle()
        await input.press('Enter')
        await page.waitForIdle()
        await expect(input).toBeHidden()
        await page.waitForIdle()
        await expect(oldDirent).toBeHidden()
        const newDirent = explorer.locator(`text=${newDirentName}`)
        await expect(newDirent).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to rename explorer item from "${oldDirentName}" to "${newDirentName}"`)
      }
    },
    async shouldHaveFocusedItem(direntName: string) {
      try {
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const dirent = explorer.locator('.monaco-list-row', {
          hasText: direntName,
        })
        await expect(dirent).toBeVisible()
        const id = await dirent.getAttribute('id')

        // TODO why is id null?
        if (id) {
          await expect(explorer).toHaveAttribute('aria-activedescendant', id)
        }
      } catch (error) {
        throw new VError(error, `Failed to verify that explorer has focused dirent "${direntName}"`)
      }
    },
    async shouldHaveItem(direntName: string) {
      return this.toHaveItem(direntName)
    },
    async toHaveItem(direntName: string) {
      try {
        await page.waitForIdle()
        const explorer = page.locator('.explorer-folders-view .monaco-list')
        const dirent = explorer.locator('.monaco-list-row', {
          hasText: direntName,
        })
        await expect(dirent).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify that explorer has dirent "${direntName}"`)
      }
    },
  }
}
