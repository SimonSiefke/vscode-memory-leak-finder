import * as Panel from '../Panel/Panel.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugConsoleFocusOnDebugConsoleView)
        await expect(repl).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show debug console`)
      }
    },
    async hide() {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
        await expect(repl).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide debug console`)
      }
    },
  }
}
