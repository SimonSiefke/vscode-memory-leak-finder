import type { TestContext } from '../types.js'

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.show({})
  await QuickPick.hide()
}
