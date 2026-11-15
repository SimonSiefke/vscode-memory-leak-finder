import { beginIteration, clickHunkAction, command, waitForHunks, waitForOwnership } from '../helpers/chatEditHunkToolbarOwnership.ts'
import type { TestContext } from '../types.ts'

export { setup, teardown } from './chat-edit-hunk-toolbar-lifecycle.ts'
export const skip = 1

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, ChatEditor } = context
  await beginIteration(context)
  await command(context, 'Start')
  await Editor.setCursor(1, 1)
  await waitForHunks(context, 24, 0)
  await Editor.setCursor(3, 1)
  await waitForHunks(context, 24, 1)
  await context.Workbench.evaluate({ expression: 'globalThis.__hunkToolbarProbe.arm = true' })
  await clickHunkAction(context, 'Keep')
  await context.Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      const check = () => {
        if (globalThis.__hunkToolbarProbe.release) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Keep did not enter the action runner gate'))
        setTimeout(check, 20)
      }
      check()
    })`,
    awaitPromise: true,
  })
  await Editor.setCursor(1, 1)
  // The real Keep action is pending. Fade completion must preserve its runner.
  await waitForOwnership(context, 1, 1, true)
  await context.Workbench.evaluate({ expression: 'globalThis.__hunkToolbarProbe.release()' })
  // Keep reveals the next pending hunk. Hide that toolbar as well.
  await waitForHunks(context, 23, 1)
  await Editor.setCursor(1, 1)
  await waitForHunks(context, 23, 0)
  await waitForOwnership(context, 0, 1)
  await context.Workbench.evaluate({
    expression: `(() => {
      const probe = globalThis.__hunkToolbarProbe
      if (probe.started !== 1 || probe.completed !== 1) {
        throw new Error('Expected one completed gated Keep')
      }
    })()`,
  })
  await Editor.setCursor(11, 1)
  await waitForHunks(context, 23, 1)
  await clickHunkAction(context, 'Undo')
  await Editor.setCursor(1, 1)
  await waitForHunks(context, 22, 0)
  await waitForOwnership(context, 0, 2)
  await command(context, 'Verify')
  await command(context, 'Finish')
  await waitForHunks(context, 0, 0)
  await waitForOwnership(context, 0, 2)
  await ChatEditor.clearAll()
  await Editor.closeAll()
}
