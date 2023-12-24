import * as Panel from '../Panel/Panel.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async killAll() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.KillAllTerminals)
      } catch (error) {
        throw new VError(error, `Failed to kill all terminals`)
      }
    },
    async show() {
      try {
        const panel = Panel.create({ expect, page, VError })
        await panel.show()
        // TODO show terminal next
      } catch (error) {
        throw new VError(error, `Failed to show panel`)
      }
    },
    async add() {
      try {
        // TODO add terminal
      } catch (error) {
        throw new VError(error, `Failed to add terminal`)
      }
    },
  }
}
