import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async addMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to add markdown cell`)
      }
    },
    async removeMarkdownCell() {
      try {
      } catch (error) {
        throw new VError(error, `Failed to remove markdown cell`)
      }
    },
  }
}
