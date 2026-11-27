import type { TestContext } from '../../e2e/types.ts'

const reply = 'Hello from the mocked Agents window.'

// Requires VS Code 1.148 or later. The launcher enables the experimental
// sessions.list.inboxEnabled setting before any session exists, because Inbox
// attention tracking ignores history completed before it first starts.
export const run = async ({ AgentsWindow, QuickPick }: TestContext): Promise<void> => {
  const stamp = Date.now()
  const first = `Inbox triage first ${stamp}`
  const second = `Inbox triage second ${stamp}`
  const created: string[] = []
  const errors: unknown[] = []
  let inbox = false
  try {
    await AgentsWindow.shouldBeVisible()
    // A previous cycle must have left Inbox mode and deleted all of its sessions.
    await AgentsWindow.shouldBeInInboxMode(false)
    await AgentsWindow.toggleInbox()
    inbox = true
    await AgentsWindow.shouldHaveSectionCount('Inbox', 0)
    for (const title of [first, second]) {
      await AgentsWindow.newChat()
      await AgentsWindow.selectNoWorkspace()
      created.push(title)
      await AgentsWindow.sendNewChat(title)
      await AgentsWindow.shouldHaveReply(reply)
      // A completed mocked turn moves the session from Working into the Inbox.
      await AgentsWindow.shouldHaveSessionInSection(title, 'Inbox')
    }
    await AgentsWindow.shouldHaveSectionCount('Inbox', 2)

    await AgentsWindow.triageSession(first, 'Acknowledge')
    await AgentsWindow.shouldHaveSessionInSection(first, 'Acknowledged')
    await AgentsWindow.shouldHaveSectionCount('Acknowledged', 1)
    await AgentsWindow.shouldHaveSessionInSection(second, 'Inbox')
    await AgentsWindow.shouldHaveSectionCount('Inbox', 1)
    await AgentsWindow.triageSession(first, 'Return to Inbox')
    await AgentsWindow.shouldHaveSessionInSection(first, 'Inbox')
    await AgentsWindow.shouldHaveSectionCount('Acknowledged', 0)
    await AgentsWindow.shouldHaveSectionCount('Inbox', 2)

    await AgentsWindow.triageSession(second, 'Put on Hold')
    await AgentsWindow.shouldHaveSessionInSection(second, 'On hold')
    await AgentsWindow.shouldHaveSectionCount('On hold', 1)
    await AgentsWindow.shouldHaveSessionInSection(first, 'Inbox')
    await AgentsWindow.shouldHaveSectionCount('Inbox', 1)
    await AgentsWindow.triageSession(second, 'Return to Inbox')
    await AgentsWindow.shouldHaveSessionInSection(second, 'Inbox')
    await AgentsWindow.shouldHaveSectionCount('On hold', 0)
    await AgentsWindow.shouldHaveSectionCount('Inbox', 2)

    await AgentsWindow.triageSession(first, 'Mark as Done')
    await AgentsWindow.shouldHaveSectionCount('Inbox', 1)
    await AgentsWindow.shouldHaveSessionInSection(second, 'Inbox')
    await AgentsWindow.shouldHaveSessionInSection(first, 'Done')
  } catch (error) {
    errors.push(error)
  } finally {
    for (const title of created.reverse()) {
      try {
        await AgentsWindow.deleteChat(title)
      } catch (error) {
        errors.push(error)
      }
    }
    if (inbox) {
      try {
        await AgentsWindow.shouldHaveSectionCount('Inbox', 0)
        await AgentsWindow.shouldHaveSectionCount('Done', 0)
        await AgentsWindow.toggleInbox()
        await AgentsWindow.shouldBeInInboxMode(false)
      } catch (error) {
        errors.push(error)
      }
    }
    try {
      await QuickPick.executeCommand('Agents: Close All Sessions', { pressKeyOnce: true })
      await AgentsWindow.newChat()
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length) throw new AggregateError(errors, errors.map((error) => String(error)).join('\n'))
}
