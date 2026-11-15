import type { TestContext } from '../types.ts'
import { setup as setupFiles, terminalReady } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Terminal.killAll()
}
export const run = async (context: TestContext): Promise<void> => {
  await context.Terminal.show()
  await terminalReady(context)
}
export const teardown = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
}
