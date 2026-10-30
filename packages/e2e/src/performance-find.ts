import type { TestContext } from '../types.ts'
import { setup as setupFiles } from '../helpers/performanceFixtures.ts'
export { teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Editor.open('small.txt')
}
export const run = async ({ Editor, EditorFind }: TestContext): Promise<void> => {
  await Editor.openFind()
  await EditorFind.setSearchValue('large needle')
  await EditorFind.shouldHaveMatchesCount('1 of 1')
}
