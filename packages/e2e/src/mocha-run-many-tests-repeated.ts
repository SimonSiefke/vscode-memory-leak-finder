import type { TestContext } from '../types.ts'
import { runSuites } from '../helpers/mochaTestRuns.ts'

export { setup, teardown } from '../helpers/mochaTestRuns.ts'

export const skip = 1

export const run = async (context: TestContext): Promise<void> => {
  // Keep the same extension host, discovered tree, and result history alive.
  await runSuites(context, [false, true, false])
}
