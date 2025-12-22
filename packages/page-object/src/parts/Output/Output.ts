import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, ideVersion, page, VError }) => {
  return {
    async filter(filterValue: string) {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const outputActions = page.locator('[aria-label="Output actions"]')
        await expect(outputActions).toBeVisible()
        const input = outputActions.locator('.input[placeholder="Filter"]')
        await expect(input).toBeVisible()
        await input.focus()
        await page.waitForIdle()
        await input.type(filterValue)
        await page.waitForIdle()
        const findMatch = page
          .locator('.findMatchInline', {
            hasText: filterValue,
          })
          .first()
        await expect(findMatch).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to filter output`)
      }
    },
    async clearFilter() {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const findMatch = page.locator('.findMatchInline').first()
        await expect(findMatch).toBeVisible()
        const outputActions = page.locator('[aria-label="Output actions"]')
        await expect(outputActions).toBeVisible()
        const input = outputActions.locator('.input[placeholder="Filter"]')
        await expect(input).toBeVisible()
        await input.focus()
        await page.waitForIdle()
        await input.clear()
        await page.waitForIdle()
        await expect(input).toHaveValue('')
        await page.waitForIdle()
        await expect(findMatch).toBeHidden({ timeout: 10_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed clear filter output`)
      }
    },
    async hide() {
      try {
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
        await expect(outputView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide output`)
      }
    },
    async select(channelName: string) {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        const select = page.locator('[aria-label="Output actions"] .monaco-select-box')
        await page.waitForIdle()
        await expect(select).toHaveAttribute('custom-hover', 'true')
        await page.waitForIdle()
        await select.focus()
        await page.waitForIdle()
        await expect(select).toBeFocused()
        await page.waitForIdle()
        await select.click()
        await page.waitForIdle()
        const monacoList = page.locator('.select-box-dropdown-list-container .monaco-list')
        await expect(monacoList).toBeVisible()
        await page.waitForIdle()
        await expect(monacoList).toBeFocused()
        await page.waitForIdle()
        const option = monacoList.locator(`[role="option"][aria-label="${channelName}"]`)
        await expect(option).toBeVisible()
        await option.click()
        await page.waitForIdle()
        await expect(monacoList).toBeHidden()
        await page.waitForIdle()
        await expect(select).toBeFocused()
        await page.waitForIdle()
        await expect(select).toHaveValue(channelName)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select output channel ${channelName}`)
      }
    },
    async show() {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.OutputFocusOnOutputView)
        await page.waitForIdle()
        await expect(outputView).toBeVisible()
        await page.waitForIdle()
        const paneBody = page.locator('.pane-body.output-view')
        await expect(paneBody).toBeVisible()
        await page.waitForIdle()
        if (ideVersion && ideVersion.minor <= 100) {
          const inputArea = paneBody.locator('.inputarea')
          await expect(inputArea).toBeVisible()
          await page.waitForIdle()
          await expect(inputArea).toBeFocused()
        } else {
          const inputArea = paneBody.locator('.native-edit-context')
          await expect(inputArea).toBeVisible()
          await page.waitForIdle()
          await expect(inputArea).toBeFocused()
        }
        await page.waitForIdle()
        const viewLines = outputView.locator('.view-lines')
        await expect(viewLines).toBeVisible()
        await page.waitForIdle()
        const select = page.locator('[aria-label="Output actions"] .monaco-select-box')
        await expect(select).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show output`)
      }
    },
  }
}
