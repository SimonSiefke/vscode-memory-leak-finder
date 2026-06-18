import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Editor from '../Editor/Editor.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const getMatchingText = async (styleElements: any, className: string): Promise<string> => {
  const [first, second] = className.split(' ')
  const styleCount = await styleElements.count()
  for (let i = 0; i < styleCount; i++) {
    const styleElement = styleElements.nth(i)
    const text = await styleElement.textContent({ allowHidden: true })
    if (text.includes(first) || text.includes(second)) {
      return text
    }
  }
  return ''
}

const getDecorationLine = (text: string, className: string): string => {
  const parts = className.split(' ')
  const lines = text.split('\n')
  for (const line of lines) {
    for (const part of parts) {
      if (line.startsWith(`.monaco-editor .${part}`)) {
        return line
      }
    }
  }
  return ''
}

const RE_CONTENT = /content: "(.*)"/

const getDecorationContent = (text: string, className: string): string => {
  const line = getDecorationLine(text, className)
  if (!line) {
    return ''
  }
  const curlyStartIndex = line.indexOf('{')
  const curlyEndIndex = line.lastIndexOf('}')
  if (curlyStartIndex === -1 || curlyEndIndex === -1) {
    return ''
  }
  const inner = line.slice(curlyStartIndex, curlyEndIndex)
  const contentMatch = inner.match(RE_CONTENT)
  if (!contentMatch) {
    return ''
  }
  const content = contentMatch[1]
  return content
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    async checkoutBranch(branchName: string) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GitCheckoutTo, {
          stayVisible: true,
        })
        await page.waitForIdle()
        await quickPick.select(` ${branchName}`)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to checkout branch "${branchName}"`)
      }
    },
    async closeRepository(name: string) {
      try {
        const repositoryRows = page.locator('.sidebar .scm-repositories-view .monaco-list-row')
        const namedRepository = page
          .locator(
            `.sidebar .scm-repositories-view .monaco-list-row[aria-label*="${name}"], .sidebar .scm-repositories-view .monaco-list-row:has-text("${name}")`,
          )
          .first()
        const repositoryProviders = page.locator('.sidebar .scm-provider')
        const repository = (await repositoryRows.count()) > 0 ? namedRepository : repositoryProviders.nth(1)
        await expect(repository).toBeVisible()
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await contextMenu.open(repository)
        await contextMenu.shouldHaveItem('Close Repository')
        await contextMenu.select('Close Repository')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close repository "${name}"`)
      }
    },
    async disableInlineBlame() {
      try {
        const decoration = page.locator('[class^="ced-1-TextEditorDecorationType"]').nth(1)
        await expect(decoration).toBeVisible()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleBlameEditorDecoration)
        await page.waitForIdle()
        await expect(decoration).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to disable inline`)
      }
    },
    async doMoreAction(name: string) {
      await page.waitForIdle()
      const moreActions = page.locator('.sidebar [aria-label^="Views and More Actions"]')
      await expect(moreActions).toBeVisible()
      await page.waitForIdle()
      await moreActions.click()
      await page.waitForIdle()
      const contextMenu = ContextMenu.create({
        electronApp,
        expect,
        ideVersion,
        page,
        platform,
        VError,
      })
      await contextMenu.shouldHaveItem(name)
      await page.waitForIdle()
      await contextMenu.select(name)
      await page.waitForIdle()
    },
    async enableInlineBlame({ expectedDecoration }: { expectedDecoration: RegExp }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleBlameEditorDecoration)
        await page.waitForIdle()
        const editor = Editor.create({ electronApp, expect, ideVersion, page, platform, VError })
        await editor.focus()
        await editor.cursorRight()
        await page.waitForIdle()
        const decoration = page.locator('[class^="ced-1-TextEditorDecorationType"]').nth(1)
        await expect(decoration).toBeVisible()
        await page.waitForIdle()
        const className = await decoration.getAttribute('class')
        const styleElements = page.locator('style')
        const text = await getMatchingText(styleElements, className)
        if (!text) {
          throw new Error(`decoration css not found`)
        }
        const content = getDecorationContent(text, className)
        if (!expectedDecoration.test(content)) {
          throw new Error(`expected decoration content to be ${expectedDecoration}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to enable inline blame`)
      }
    },
    async hideBranchPicker() {
      try {
        await page.waitForIdle()
        const quickInput = page.locator('.quick-input-widget.show-checkboxes')
        await expect(quickInput).toBeVisible()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(quickInput).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide branch picker`)
      }
    },
    async hideGraph() {
      try {
        await page.waitForIdle()
        const input = page.locator('.scm-input')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        const editContext = input.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        const management = page.locator('[aria-label="Source Control Management"]')
        await expect(management).toBeVisible()
        await page.waitForIdle()
        const graph = page.locator('[aria-label="Graph Section"]')
        const count = await graph.count()
        if (count === 0) {
          return
        }
        const actions = page.locator(`[aria-label="Source Control actions"]`)
        await expect(actions).toBeVisible()
        await page.waitForIdle()
        const moreActions = actions.locator(`[aria-label^="Views and More Actions"]`)
        await expect(moreActions).toBeVisible()
        await page.waitForIdle()
        await moreActions.click()
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await contextMenu.shouldHaveItem(`Graph`)
        // @ts-ignore
        await contextMenu.uncheck('Graph')
        await page.waitForIdle()
        await contextMenu.close()
        await page.waitForIdle()
        await expect(graph).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide graph`)
      }
    },
    async openChange(name: string) {
      try {
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        await expect(file).toBeVisible()
        const diffEditor = page.locator('.monaco-diff-editor')
        const open = async (fn: () => Promise<void>) => {
          await fn()
          try {
            await expect(diffEditor).toBeVisible({
              timeout: 5000,
            })
            return true
          } catch {
            return false
          }
        }
        if (await open(() => file.click())) {
          return
        }
        if (await open(() => file.dblclick())) {
          return
        }
        await file.click()
        if (await open(() => page.keyboard.press('Enter'))) {
          return
        }
        throw new Error(`diff editor did not open`)
      } catch (error) {
        throw new VError(error, `Failed to open change "${name}"`)
      }
    },
    async refresh() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GitRefresh)
      } catch (error) {
        throw new VError(error, `Failed to git refresh`)
      }
    },
    async selectBranch(branchName: string) {
      try {
        await page.waitForIdle()
        const quickInput = page.locator('.quick-input-widget.show-checkboxes')
        await expect(quickInput).toBeVisible()
        const option = quickInput.locator('.label-name', {
          hasExactText: branchName,
        })
        await expect(option).toBeVisible()
        await option.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select branch "${branchName}"`)
      }
    },
    async shouldHaveHistoryItem(name: string) {
      try {
        const history = page.locator('[aria-label="Source Control History"]')
        await expect(history).toBeVisible()
        const item = history.locator(`.monaco-list-row[aria-label^="${name}"]`)
        await expect(item).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to verify history item`)
      }
    },
    async shouldHaveRepositoryCount(count: number) {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-item:has(.action-label[aria-label^="Source Control"])`)
        await expect(activityBarItem).toBeVisible()
        const expanded = await activityBarItem.getAttribute('aria-expanded')
        if (expanded === 'false') {
          await activityBarItem.click()
        }
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText('Source Control')
        const repositoryRows = page.locator('.sidebar .scm-repositories-view .monaco-list-row')
        const repositoryProviders = page.locator('.sidebar .scm-provider')
        const repositoryInputs = page.locator('.sidebar .scm-input')
        const sourceControlManagement = page.locator('.sidebar [aria-label="Source Control Management"]')
        const sourceControlActions = page.locator('.sidebar [aria-label="Source Control actions"]')
        const getRepositoryCount = async () => {
          const repositoryRowCount = await repositoryRows.count()
          if (repositoryRowCount > 0) {
            return repositoryRowCount
          }
          const repositoryProviderCount = await repositoryProviders.count()
          if (repositoryProviderCount > 0) {
            return repositoryProviderCount
          }
          const repositoryInputCount = await repositoryInputs.count()
          if (repositoryInputCount > 0) {
            return repositoryInputCount
          }
          if (count === 1) {
            const sourceControlManagementCount = await sourceControlManagement.count()
            if (sourceControlManagementCount > 0) {
              return 1
            }
            const sourceControlActionsCount = await sourceControlActions.count()
            if (sourceControlActionsCount > 0) {
              return 1
            }
          }
          return 0
        }
        const timeout = 10_000
        const startTime = Date.now()
        while (Date.now() - startTime < timeout) {
          const actualCount = await getRepositoryCount()
          if (actualCount === count) {
            return
          }
          await (() => {
            const { promise, resolve } = Promise.withResolvers<void>()
            setTimeout(resolve, 100)
            return promise
          })()
        }
        const actualCount = await getRepositoryCount()
        throw new Error(`expected repository count ${count} but got ${actualCount}`)
      } catch (error) {
        throw new VError(error, `Failed to verify repository count ${count}`)
      }
    },
    async shouldHaveUnstagedFile(name: string) {
      try {
        const changesPart = page.locator('[role="treeitem"][aria-label="Changes"]')
        await expect(changesPart).toBeVisible()
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        await expect(file).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to check unstaged file`)
      }
    },
    async shouldNotHaveHistoryItem(name: string) {
      try {
        const history = page.locator('[aria-label="Source Control History"]')
        await expect(history).toBeVisible()
        const item = history.locator(`.monaco-list-row[aria-label^="${name}"]`)
        await expect(item).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify that history item is hidden`)
      }
    },
    async show() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-item:has(.action-label[aria-label^="Source Control"])`)
        await expect(activityBarItem).toBeVisible()
        const expanded = await activityBarItem.getAttribute('aria-expanded')
        if (expanded === 'false') {
          await activityBarItem.click()
        }
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText('Source Control')
      } catch (error) {
        throw new VError(error, `Failed to show source control`)
      }
    },
    async showBranchPicker() {
      try {
        await page.waitForIdle()
        const graphSection = page.locator('[aria-label="Graph Section"]')
        await expect(graphSection).toBeVisible()
        const action = graphSection.locator('a.scm-graph-history-item-picker')
        await expect(action).toHaveAttribute('aria-disabled', null)
        await expect(action).toBeVisible()
        await page.waitForIdle()
        await action.click()
        await page.waitForIdle()
        const quickInput = page.locator('.quick-input-widget.show-checkboxes')
        await expect(quickInput).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show branch picker`)
      }
    },
    async showGraph() {
      try {
        await page.waitForIdle()
        const input = page.locator('.scm-input')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        const editContext = input.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        const management = page.locator('[aria-label="Source Control Management"]')
        await expect(management).toBeVisible()
        await page.waitForIdle()
        const graph = page.locator('[aria-label="Graph Section"]')
        const count = await graph.count()
        if (count > 0) {
          return
        }
        const actions = page.locator(`[aria-label="Source Control actions"]`)
        await expect(actions).toBeVisible()
        await page.waitForIdle()
        const moreActions = actions.locator(`[aria-label^="Views and More Actions"]`)
        await expect(moreActions).toBeVisible()
        await page.waitForIdle()
        await moreActions.click()
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        // @ts-ignore
        await contextMenu.openSubMenu('Views')
        // @ts-ignore
        await contextMenu.checkSubItem('Graph')
        await page.waitForIdle()
        // await contextMenu.close()
        await page.waitForIdle()
        await expect(graph).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show graph`)
      }
    },
    async stageFile(name: string, parentFolder?: string) {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GitStageAllChanges)
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        if (parentFolder) {
          await expect(file).toHaveAttribute('aria-label', `${name}, Index Added, ${[parentFolder]}`)
        } else {
          await expect(file).toHaveAttribute('aria-label', `${name}, Index Added`)
        }
      } catch (error) {
        throw new VError(error, `Failed to stage file`)
      }
    },
    async undoLastCommit() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.UndoLastCommit)
      } catch (error) {
        throw new VError(error, `Failed to undo last commit`)
      }
    },
    async unstageAllChanges() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GitUnstageAllChanges)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to unstage all changes`)
      }
    },
    async unstageFile(name: string) {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GitUnstageAllChanges)
        const file = page.locator(`[role="treeitem"][aria-label^="${name}"]`)
        await expect(file).toHaveAttribute('aria-label', `${name}, Untracked`)
      } catch (error) {
        throw new VError(error, `Failed to unstage file`)
      }
    },
    async viewAsList() {
      try {
        await this.doMoreAction('View as List')
        const src = page.locator('[aria-label="src"][aria-expanded="true"]')
        await expect(src).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to view as list`)
      }
    },
    async viewAsTree() {
      try {
        await this.doMoreAction('View as Tree')
        const src = page.locator('[aria-label="src"][aria-expanded="true"]')
        await expect(src).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to view as tree`)
      }
    },
  }
}
