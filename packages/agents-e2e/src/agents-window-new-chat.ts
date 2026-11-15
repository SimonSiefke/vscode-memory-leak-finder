import type { TestContext } from '../../e2e/types.ts'

export const run = async ({ AgentsWindow }: TestContext): Promise<void> => {
  await AgentsWindow.newChat()
  await AgentsWindow.shouldHaveSendDisabled()
  await AgentsWindow.typeDraft('An unsent draft')
  await AgentsWindow.clearDraft()
  await AgentsWindow.shouldHaveSendDisabled()
  await AgentsWindow.newChat()
  await AgentsWindow.shouldHaveNewChat()
}
