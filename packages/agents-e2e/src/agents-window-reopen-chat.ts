import type { TestContext } from '../../e2e/types.ts'

const title = `Agents reopen chat test ${Date.now()}`

export const setup = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.newChat()
}

export const run = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.sendNewChat(title)
  await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
  await AgentsWindow.newChat()
  await AgentsWindow.shouldHaveSession(title)
  await AgentsWindow.openChat(title)
  await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
  await AgentsWindow.deleteChat(title)
  await AgentsWindow.newChat()
}
