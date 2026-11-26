import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getPane = () => page.locator('.outline-pane')
  const getRows = () => page.locator('.outline-pane .outline-tree .monaco-list-row')
  const getRow = (name: string) => getRows().locator('.outline-element .label-name', { hasExactText: name })

  return {
    async focus() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusOnOutlineView)
        await expect(getPane()).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus outline view`)
      }
    },
    async select(name: string) {
      try {
        await page.waitForIdle()
        const row = getRow(name)
        await expect(row).toBeVisible()
        await row.click()
        await page.waitForIdle()
        const selected = page.locator('.outline-pane .outline-tree .monaco-list-row.selected .label-name')
        await expect(selected).toHaveText(name)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select outline symbol "${name}"`)
      }
    },
    async shouldHaveMessage(message: string) {
      try {
        await page.waitForIdle()
        const pane = getPane()
        await expect(pane).toBeVisible()
        await expect(pane).toHaveClass('message')
        await expect(pane.locator('.outline-message')).toHaveText(message)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify outline message "${message}"`)
      }
    },
    async shouldHaveSymbols(names: readonly string[]) {
      try {
        await page.waitForIdle()
        const pane = getPane()
        await expect(pane).toBeVisible()
        const rows = getRows()
        await expect(rows).toHaveCount(names.length)
        for (let index = 0; index < names.length; index++) {
          await expect(rows.nth(index).locator('.outline-element .label-name')).toHaveText(names[index])
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify outline symbols ${names.join(', ')}`)
      }
    },
  }
}
