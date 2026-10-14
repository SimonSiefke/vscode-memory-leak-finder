import type { TestContext } from '../types.ts'
import { setup as setupFiles, visibleEditorText } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Editor.open('small.txt')
  await context.Editor.focus()
}
export const run = async (context: TestContext): Promise<void> => {
  await context.Editor.typeCharacters('a'.repeat(100))
  await visibleEditorText(context, 'a'.repeat(100))
}
export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.save({ viaKeyBoard: true })
  await Editor.closeAll()
}
