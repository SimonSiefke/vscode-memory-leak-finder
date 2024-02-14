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
        await panel.close()
        await expect(outputView).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide output`)
      }
    },
  }
}
