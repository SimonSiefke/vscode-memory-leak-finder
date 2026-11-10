import type { TestContext } from '../../e2e/types.ts'

const title = `Agents send message test ${Date.now()}`

export const setup = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.newChat()
}

export const run = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.sendNewChat(title)
  await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
  await AgentsWindow.shouldHaveSession(title)
  await AgentsWindow.sendMessage('A follow up message')
  await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.', 2)
  await AgentsWindow.shouldHaveRequest(title)
  await AgentsWindow.deleteChat(title)
  await AgentsWindow.newChat()
}
