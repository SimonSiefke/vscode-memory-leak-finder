import {
  beginIteration,
  clickHunkAction,
  command,
  installOwnershipProbe,
  restoreOwnershipProbe,
  waitForHunks,
  waitForOwnership,
} from '../helpers/chatEditHunkToolbarOwnership.ts'
import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async (context: TestContext): Promise<void> => {
  await context.Editor.closeAll()
  await command(context, 'Setup')
  await context.ChatEditor.clearAll()
  await installOwnershipProbe(context)
}

export const run = async (context: TestContext): Promise<void> => {
  const { ChatEditor, Editor } = context
  await beginIteration(context)
  await command(context, 'Start')
  await Editor.setCursor(1, 1)
  // Hidden pooled widgets must not each retain a menu-backed toolbar.
  await waitForHunks(context, 24, 0)
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const line of [3, 11, 19, 27]) {
      await Editor.setCursor(line, 1)
      await waitForHunks(context, 24, 1)
      await waitForOwnership(context, 1, cycle * 4 + 1)
    }
    await Editor.setCursor(1, 1)
    // Poll through fade-out and check menu disposal with the session still alive.
    await waitForHunks(context, 24, 0)
    await waitForOwnership(context, 0, (cycle + 1) * 4)
  }

  await Editor.setCursor(3, 1)
  await waitForHunks(context, 24, 1)
  await clickHunkAction(context, 'Keep')
  await Editor.setCursor(11, 1)
  await waitForHunks(context, 23, 1)
  await clickHunkAction(context, 'Undo')
  await Editor.setCursor(1, 1)
  await waitForHunks(context, 22, 0)
  await waitForOwnership(context, 0, 14)
  await context.Workbench.evaluate({
    expression: `(() => { if (globalThis.__hunkToolbarProbe.reused < 3) throw new Error('Expected repeated pooled widget reuse') })()`,
  })
  await command(context, 'Verify')
  await command(context, 'Finish')
  // Assert cleanup before disposing the chat session; disposal already freed the old menus.
  await waitForHunks(context, 0, 0)
  await waitForOwnership(context, 0, 14)
  await ChatEditor.clearAll()
  await Editor.closeAll()
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    await restoreOwnershipProbe(context)
  } finally {
    try {
      await context.ChatEditor.clearAll()
    } finally {
      await command(context, 'Cleanup')
    }
  }
}
