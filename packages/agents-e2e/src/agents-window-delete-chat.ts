import type { TestContext } from '../../e2e/types.ts'

const title = `Agents delete chat test ${Date.now()}`

export const setup = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.newChat()
}

export const run = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.sendNewChat(title)
  await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
  await AgentsWindow.shouldHaveSession(title)
  await AgentsWindow.newChat()
  await AgentsWindow.deleteChat(title)
  await AgentsWindow.shouldHaveNewChat()
}
