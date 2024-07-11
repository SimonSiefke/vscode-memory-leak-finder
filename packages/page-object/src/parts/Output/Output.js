import * as Panel from '../Panel/Panel.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.OutputFocusOnOutputView)
        await expect(outputView).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show output`)
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
    async select(channelName) {
      try {
        await page.waitForIdle()
        const outputView = page.locator('.pane-body.output-view')
        await expect(outputView).toBeVisible()
        await page.waitForIdle()
        const select = page.locator('[aria-label="Output actions"] .monaco-select-box')
        await select.click()
        const monacoList = page.locator('.select-box-dropdown-list-container .monaco-list')
        await expect(monacoList).toBeVisible()
        await expect(monacoList).toBeFocused()
        const option = monacoList.locator(`[role="option"][aria-label="${channelName}"]`)
        await expect(option).toBeVisible()
        await option.click()
        await expect(select).toBeFocused()
        await expect(select).toHaveValue(channelName)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select output channel ${channelName}`)
      }
    },
  }
}
