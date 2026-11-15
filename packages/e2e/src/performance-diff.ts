import type { TestContext } from '../types.ts'
import { setup as setupFiles } from '../helpers/performanceFixtures.ts'
export { teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Explorer.focus()
  await context.Explorer.refresh()
  await context.Explorer.shouldHaveItem('before.txt')
  await context.Explorer.shouldHaveItem('after.txt')
}
export const run = async ({ DiffEditor }: TestContext): Promise<void> => {
  await DiffEditor.open({
    file1: 'before.txt',
    file1Content: 'large needle\nunchanged\nbefore\n',
    file2: 'after.txt',
    file2Content: 'large needle\nunchanged\nafter\n',
    cell1Content: '',
    cell2Content: '',
  })
}
