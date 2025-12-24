import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, ideVersion, page, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ManageLanguageModels)
        // TODO verify editor is open
      } catch (error) {
        throw new VError(error, `Failed to set chat context`)
      }
    },
  }
}
