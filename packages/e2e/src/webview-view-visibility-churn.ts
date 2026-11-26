import type { TestContext } from '../types.ts'

export const skip = 1

const prefix = 'Webview View Visibility Churn'
const extensionId = 'memory-leak-fixtures.webview-view-visibility-churn'
const containerLabel = 'Webview View Churn'

type FixtureContext = Pick<TestContext, 'Notification' | 'QuickPick' | 'Workbench'>

const runFixtureCommand = async ({ Notification, QuickPick, Workbench }: FixtureContext, command: string, expected: string) => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand(`${prefix}: ${command}`)
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem(`${prefix}: ${expected}`)
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression:
        "Array.from(document.querySelectorAll('.notifications-toasts .monaco-list-row')).map(item => item.getAttribute('aria-label')).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

// Overlay webviews are positioned over their pane, so locate the frame by geometry.
const shouldHaveFrameIn = async ({ Workbench }: Pick<TestContext, 'Workbench'>, location: 'none' | 'panel' | 'sidebar') => {
  const result = await Workbench.evaluate({
    awaitPromise: true,
    expression: `new Promise((resolve) => {
      const deadline = Date.now() + 10000
      const describe = () => {
        const frames = Array.from(document.querySelectorAll('iframe.webview')).filter((frame) => (frame.getAttribute('src') || '').includes('extensionId=${extensionId}'))
        if (frames.length === 0) return 'none'
        if (frames.length > 1) return 'frames:' + frames.length
        const rect = frames[0].getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return 'zero-size'
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        for (const [name, selector] of [['sidebar', '.part.sidebar'], ['panel', '.part.panel']]) {
          const part = document.querySelector(selector)
          if (!part) continue
          const box = part.getBoundingClientRect()
          if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) return name
        }
        return 'elsewhere'
      }
      const check = () => {
        const actual = describe()
        if (actual === '${location}' || Date.now() > deadline) resolve(actual)
        else setTimeout(check, 50)
      }
      check()
    })`,
  })
  if (result !== location) {
    throw new Error(`Expected ${extensionId} webview frame location ${location} but got ${String(result)}`)
  }
}

const showChurnView = async ({ ActivityBar, WebView }: Pick<TestContext, 'ActivityBar' | 'WebView'>) => {
  await ActivityBar.showView({ ariaLabel: containerLabel, titleLabel: new RegExp(containerLabel) })
  await WebView.shouldBeVisible2({ extensionId, hasLineOfCodeCounter: false })
}

export const setup = async (context: TestContext): Promise<void> => {
  await runFixtureCommand(context, 'Setup', 'setup complete')
  await context.ActivityBar.showExplorer()
  await shouldHaveFrameIn(context, 'none')
}

export const run = async (context: TestContext): Promise<void> => {
  const { ActivityBar, Panel } = context
  await showChurnView(context)
  await runFixtureCommand(context, 'Expect Ready', 'ready')
  await shouldHaveFrameIn(context, 'sidebar')

  // A plain hide releases the frame; showing again reloads the content without retained context.
  await ActivityBar.showExplorer()
  await runFixtureCommand(context, 'Expect Hidden', 'hidden')
  await shouldHaveFrameIn(context, 'none')
  await showChurnView(context)
  await runFixtureCommand(context, 'Expect Ready', 'ready')
  await shouldHaveFrameIn(context, 'sidebar')

  await runFixtureCommand(context, 'Move To Panel', 'moved to panel')
  await runFixtureCommand(context, 'Expect Ready', 'ready')
  await shouldHaveFrameIn(context, 'panel')

  await runFixtureCommand(context, 'Move Back', 'moved back')
  await runFixtureCommand(context, 'Expect Ready', 'ready')
  await shouldHaveFrameIn(context, 'sidebar')

  await ActivityBar.showExplorer()
  await runFixtureCommand(context, 'Expect Hidden', 'hidden')
  await shouldHaveFrameIn(context, 'none')
  await Panel.hide()
}

export const teardown = async (context: TestContext): Promise<void> => {
  await runFixtureCommand(context, 'Cleanup', 'cleanup complete')
  await context.ActivityBar.showExplorer()
  await shouldHaveFrameIn(context, 'none')
  await context.Panel.hide()
}
