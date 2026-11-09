import type { TestContext } from '../types.ts'
import { visibleEditorText } from '../helpers/performanceFixtures.ts'
export { setup, teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const run = async (context: TestContext): Promise<void> => {
  await context.Editor.open('large.txt')
  await visibleEditorText(context, 'line 0 large needle')
}
