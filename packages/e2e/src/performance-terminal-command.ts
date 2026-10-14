import type { TestContext } from '../types.ts'
import { setup as setupFiles, terminalReady } from '../helpers/performanceFixtures.ts'
export const skip = true
export const setup = async (context: TestContext): Promise<void> => {
  await setupFiles(context)
  await context.Terminal.show()
  await terminalReady(context)
}
export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.execute('echo LARGE_COMMAND_DONE', { viaNativeKeyboard: true })
  await Terminal.shouldHaveOutputLine('LARGE_COMMAND_DONE')
}
export const teardown = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
}
