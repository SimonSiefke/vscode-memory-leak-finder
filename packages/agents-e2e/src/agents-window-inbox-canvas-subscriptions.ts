import type { TestContext } from '../../e2e/types.ts'
import { connect, waitFor } from '../helpers/InboxCanvasFixture.ts'

export const run = async ({ AgentsWindow, Electron, Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await AgentsWindow.shouldBeVisible()
  await waitFor(
    'the smoke-test driver',
    () => Workbench.evaluate({ expression: 'typeof window.driver?.whenWorkbenchRestored' }),
    (value) => value === 'function',
  )
  await Workbench.evaluate({ expression: 'window.driver.whenWorkbenchRestored()', awaitPromise: true })
  const environment = (await Electron.evaluate(
    '({directory: process.env.VMLF_INBOX_FIXTURE, userData: process.env.VMLF_INBOX_USER_DATA})',
  )) as { directory?: string; userData?: string }
  if (!environment.directory || !environment.userData)
    throw new Error('Inbox canvas fixture requires the Agents window and proxy mock launch flags')
  const fixture = await connect(environment.directory, environment.userData)
  const titles: string[] = []
  const errors: unknown[] = []
  try {
    await QuickPick.executeCommand('View: Close All Editors', { pressKeyOnce: true })
    // The first pair warms the real provider/UI path; subsequent pairs use distinct
    // sessions so an accidentally cached canvas cannot satisfy readiness.
    for (let iteration = 0; iteration < 3; iteration++) {
      const create = async (role: string) => {
        const title = `Inbox ${role} ${Date.now()} ${iteration}`
        if (role === 'evidence') await AgentsWindow.armCanvasObserver()
        await AgentsWindow.newChat()
        await AgentsWindow.selectNoWorkspace()
        titles.push(title)
        await AgentsWindow.sendNewChat(title)
        await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
        return { title, ...(await fixture.openNewCanvas(title)) }
      }
      const inactive = await create('evidence')
      await AgentsWindow.keepCanvasObserver(inactive.title)
      await fixture.expectSubscribed(inactive.resource, true)
      const peer = await create('active peer')
      await fixture.expectSubscribed(peer.resource, true)
      // The previous chat's ordinary UI observers must not keep an inactive
      // canvas subscribed. An Inbox presentation supplies an explicit lease.
      await fixture.expectSubscribed(inactive.resource, false, peer.resource)
      await AgentsWindow.showInboxEvidence(inactive.title)
      await fixture.expectSubscribed(inactive.resource, true, peer.resource)
      await Notification.closeAll({ force: true })
      await AgentsWindow.presentInboxCanvas()
      await Electron.waitForWebContentsText({
        urlPattern: new RegExp(`^http://127\\.0\\.0\\.1:${new URL(inactive.url).port}/?$`),
        selector: 'h1',
        text: 'Inbox contract canvas',
      })
      await AgentsWindow.hideInboxCanvas()
      // Hiding native content keeps the evidence's canvas-list lease alive.
      await fixture.expectSubscribed(inactive.resource, true, peer.resource)
      await AgentsWindow.closeInboxEvidence()
      await fixture.expectSubscribed(inactive.resource, false, peer.resource)
      await AgentsWindow.disposeCanvasObservers()
      await QuickPick.executeCommand('View: Close All Editors', { pressKeyOnce: true })
    }
  } catch (error) {
    errors.push(error)
  } finally {
    try {
      await AgentsWindow.disposeCanvasObservers()
    } catch (error) {
      errors.push(error)
    }
    try {
      await QuickPick.executeCommand('Agents: Close All Sessions', { pressKeyOnce: true })
    } catch (error) {
      errors.push(error)
    }
    try {
      await AgentsWindow.disposeCanvasObservers()
      await QuickPick.executeCommand('View: Close All Editors', { pressKeyOnce: true })
    } catch (error) {
      errors.push(error)
    }
    for (const title of titles.reverse()) {
      try {
        await AgentsWindow.deleteChat(title)
      } catch (error) {
        errors.push(error)
      }
    }
  }
  if (errors.length) throw new AggregateError(errors, errors.map((error) => String(error)).join('\n'))
}
