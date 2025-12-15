import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveCount(count) {
      try {
        const problemsBadge = page.locator('[role="tab"] [aria-label^="Problems"] + .badge')
        const badgeContent = problemsBadge.locator('.badge-content')
        if (count === 0) {
          await expect(problemsBadge).toBeHidden()
        } else {
          await expect(problemsBadge).toBeVisible()
          await expect(badgeContent).toHaveText(`${count}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to assert problems count of ${count}`)
      }
    },
    async show() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ProblemsFocusOnProblemsView)
        await expect(markersPanel).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show problems`)
      }
    },
    async hide() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
        await expect(markersPanel).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide problems`)
      }
    },
    async switchToListView() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const treeView = markersPanel.locator('.monaco-tree')
        const isTreeVisible = await treeView.isVisible().catch(() => false)
        if (isTreeVisible) {
          const toolbar = markersPanel.locator('.monaco-action-bar, .actions-container, .toolbar')
          const viewModeButton = toolbar
            .locator(
              '[aria-label*="View Mode"], [aria-label*="Toggle View"], [aria-label*="List"], [aria-label*="Tree"], [title*="View Mode"], [title*="Toggle View"], [aria-label*="Switch"], button[class*="view"], .action-item[class*="view"]',
            )
            .first()
          const buttonExists = await viewModeButton.isVisible().catch(() => false)
          if (buttonExists) {
            await viewModeButton.click()
            await page.waitForIdle()
          } else {
            const allButtons = toolbar.locator('button, .action-item, [role="button"]')
            const buttonCount = await allButtons.count()
            for (let i = 0; i < buttonCount; i++) {
              const button = allButtons.nth(i)
              const ariaLabel = await button.getAttribute('aria-label').catch(() => '')
              const title = await button.getAttribute('title').catch(() => '')
              if (
                (ariaLabel && (ariaLabel.includes('View') || ariaLabel.includes('List') || ariaLabel.includes('Tree'))) ||
                (title && (title.includes('View') || title.includes('List') || title.includes('Tree')))
              ) {
                await button.click()
                await page.waitForIdle()
                break
              }
            }
          }
        }
        const listView = markersPanel.locator('.monaco-list')
        await expect(listView).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to switch to list view`)
      }
    },
    async switchToTableView() {
      try {
        await page.waitForIdle()
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        await page.waitForIdle()
        const panel = page.locator('.part.panel')
        const viewAsTableButton = panel.locator('[aria-label="View as Table"]')
        const count = await viewAsTableButton.count()
        if (count === 0) {
          return
        }
        const listView = markersPanel.locator('.monaco-list')
        const isListVisible = await listView.isVisible().catch(() => false)
        if (isListVisible) {
          const toolbar = markersPanel.locator('.monaco-action-bar, .actions-container, .toolbar')
          const viewModeButton = toolbar
            .locator(
              '[aria-label*="View Mode"], [aria-label*="Toggle View"], [aria-label*="List"], [aria-label*="Tree"], [title*="View Mode"], [title*="Toggle View"], [aria-label*="Switch"], button[class*="view"], .action-item[class*="view"]',
            )
            .first()
          const buttonExists = await viewModeButton.isVisible().catch(() => false)
          if (buttonExists) {
            await viewModeButton.click()
            await page.waitForIdle()
          } else {
            const allButtons = toolbar.locator('button, .action-item, [role="button"]')
            const buttonCount = await allButtons.count()
            for (let i = 0; i < buttonCount; i++) {
              const button = allButtons.nth(i)
              const ariaLabel = await button.getAttribute('aria-label').catch(() => '')
              const title = await button.getAttribute('title').catch(() => '')
              if (
                (ariaLabel && (ariaLabel.includes('View') || ariaLabel.includes('List') || ariaLabel.includes('Tree'))) ||
                (title && (title.includes('View') || title.includes('List') || title.includes('Tree')))
              ) {
                await button.click()
                await page.waitForIdle()
                break
              }
            }
          }
        }
        const treeView = markersPanel.locator('.monaco-tree')
        await expect(treeView).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to switch to tree view`)
      }
    },
    async shouldBeInListView() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        const listView = markersPanel.locator('.monaco-list')
        await expect(listView).toBeVisible()
        const treeView = markersPanel.locator('.monaco-tree')
        await expect(treeView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify list view`)
      }
    },
    async shouldBeInTreeView() {
      try {
        const markersPanel = page.locator('.markers-panel')
        await expect(markersPanel).toBeVisible()
        const treeView = markersPanel.locator('.monaco-tree')
        await expect(treeView).toBeVisible()
        const listView = markersPanel.locator('.monaco-list')
        await expect(listView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify tree view`)
      }
    },
  }
}
