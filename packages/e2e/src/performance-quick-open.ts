import type { TestContext } from '../types.ts'
export { setup, teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.show({ pressKeyOnce: true })
  await QuickPick.type('small.txt')
  await QuickPick.shouldHaveItem('small.txt')
}
