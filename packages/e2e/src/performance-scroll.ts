import type { TestContext } from '../types.ts'
import { setup as setupFiles } from '../helpers/performanceFixtures.ts'
export { teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Editor.open('large.txt')
  await context.Editor.focus()
}
export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.scrollDown()
  await Editor.shouldContainText('line 19999 large needle')
}
