import type { TestContext } from '../types.ts'
import { setup as setupFiles } from '../helpers/performanceFixtures.ts'
export { teardown } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.ActivityBar.showSearch()
}
export const run = async ({ Search }: TestContext): Promise<void> => {
  await Search.type('small deterministic file')
  await Search.submit()
  await Search.shouldHaveSummary(/1 result in 1 file/)
}
