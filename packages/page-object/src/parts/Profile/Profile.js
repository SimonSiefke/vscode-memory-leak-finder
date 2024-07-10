import * as QuickPick from '../QuickPick/QuickPick.js'

export const create = ({ page, expect, VError }) => {
  return {
    async create(info) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create profile`)
      }
    },
    async remove(id) {
      throw new Error('not implemented')
    },
  }
}
