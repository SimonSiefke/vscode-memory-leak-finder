import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'
import * as Panel from '../Panel/Panel.js'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusPortsView)
        const portsView = page.locator('#\\~remote\\.forwardedPortsContainer')
        await expect(portsView).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open ports view`)
      }
    },
    async close() {
      try {
        const portsView = page.locator('#\\~remote\\.forwardedPortsContainer')
        await expect(portsView).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
      } catch (error) {
        throw new VError(error, `Failed to close ports view`)
      }
    },
  }
}
