import type { TestContext } from '../types.ts'

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.show({})
  await QuickPick.hide()
}
