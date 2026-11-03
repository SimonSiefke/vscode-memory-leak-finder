import type { TestContext } from '../types.ts'

export const skip = 1

const command = async ({ Notification, QuickPick }: TestContext, name: string): Promise<void> => {
  await Notification.closeAll({ force: true })
  await QuickPick.executeCommand(`Chat Edit Hunk Toolbar Lifecycle: ${name}`)
  await Notification.shouldHaveItem(`Chat Edit Hunk Toolbar Lifecycle: ${name.toLowerCase()} complete`)
  await Notification.closeAll({ force: true })
}

const waitForHunks = async ({ Workbench }: TestContext, hunks: number, toolbars: number): Promise<void> => {
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      const check = () => {
        const widgets = document.querySelectorAll('.part.editor .chat-diff-change-content-widget')
        const menus = document.querySelectorAll('.part.editor .chat-diff-change-content-widget .monaco-toolbar')
        if (widgets.length === ${hunks} && menus.length === ${toolbars}) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Expected ${hunks} hunk widgets and ${toolbars} toolbars; got ' + widgets.length + ' and ' + menus.length))
        setTimeout(check, 50)
      }
      check()
    })`,
    awaitPromise: true,
  })
}

const clickHunkAction = async ({ Workbench }: TestContext, label: string): Promise<void> => {
  await Workbench.evaluate({
    expression: `(() => {
      const actions = Array.from(document.querySelectorAll('.part.editor .chat-diff-change-content-widget.hover .action-label'))
      const action = actions.find(node => node.getAttribute('aria-label')?.startsWith(${JSON.stringify(label)}))
      if (!action) throw new Error('Missing visible hunk action ${label}: ' + actions.map(node => node.getAttribute('aria-label')).join(', '))
      action.click()
    })()`,
  })
}

export const setup = async (context: TestContext): Promise<void> => {
  await context.Editor.closeAll()
  await command(context, 'Setup')
  await context.ChatEditor.clearAll()
}

export const run = async (context: TestContext): Promise<void> => {
  const { ChatEditor, Editor } = context
  await command(context, 'Start')
  await Editor.setCursor(1, 1)
  // Hidden pooled widgets must not each retain a menu-backed toolbar.
  await waitForHunks(context, 24, 0)
  await Editor.setCursor(3, 1)
  await waitForHunks(context, 24, 1)
  await Editor.setCursor(11, 1)
  await waitForHunks(context, 24, 1)
  await Editor.setCursor(1, 1)
  // Poll through the fade-out delay instead of asserting immediately after hiding.
  await waitForHunks(context, 24, 0)

  await Editor.setCursor(3, 1)
  await waitForHunks(context, 24, 1)
  await clickHunkAction(context, 'Keep')
  await Editor.setCursor(11, 1)
  await waitForHunks(context, 23, 1)
  await clickHunkAction(context, 'Undo')
  await Editor.setCursor(1, 1)
  await waitForHunks(context, 22, 0)
  await command(context, 'Verify')
  await command(context, 'Finish')
  // Assert cleanup before disposing the chat session; disposal already freed the old menus.
  await waitForHunks(context, 0, 0)
  await ChatEditor.clearAll()
  await Editor.closeAll()
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    await context.ChatEditor.clearAll()
  } finally {
    await command(context, 'Cleanup')
  }
}
