import type { TestContext } from '../../e2e/types.ts'
import { run as reopenChat } from './agents-window-reopen-chat.ts'

export const setup = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.newChat()
  const warmup = 'Prepare Quick Chat test'
  await AgentsWindow.sendNewChat(warmup)
  await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
  await AgentsWindow.deleteChat(warmup)
  await AgentsWindow.newChat()
  await AgentsWindow.selectNoWorkspace()
}

export const run = async (context: TestContext): Promise<void> => {
  await context.AgentsWindow.selectNoWorkspace()
  await reopenChat(context)
}
