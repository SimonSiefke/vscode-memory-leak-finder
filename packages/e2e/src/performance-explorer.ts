import type { TestContext } from '../types.ts'
import { setup as setupFiles } from '../helpers/performanceFixtures.ts'
export { teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Explorer.focus()
  await context.Explorer.refresh()
  await context.Explorer.shouldHaveItem('folder')
}
export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.expand('folder')
  await Explorer.shouldHaveItem('item-0.txt')
  await Explorer.shouldHaveItem('item-19.txt')
}
