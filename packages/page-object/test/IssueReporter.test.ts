import { expect, jest, test } from '@jest/globals'
import { createContext, runInContext } from 'node:vm'
import * as IssueReporter from '../src/parts/IssueReporter/IssueReporter.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

const createReporter = (options: { message: string; buttons: string[] }, failAfterClose = false, withWindow = true) => {
  const originalDialog = jest.fn(async () => ({ response: -1 }))
  const dialog = { showMessageBox: originalDialog }
  const context = createContext({ _____electron: { dialog } })
  let response: { response: number; checkboxChecked?: boolean } | undefined
  let closed = false
  const locator = (selector: string): any => ({
    boundingBox: async () => ({ x: 0, y: 0, width: 10, height: 10 }),
    isVisible: async () => false,
    locator: (child: string) => locator(`${selector} ${child}`),
  })
  const page = {
    locator,
    sessionRpc: {
      invoke: async (_method: string, event: { type: string }) => {
        if (event.type === 'mouseReleased') {
          const args = withWindow ? [{}, options] : [options]
          response = await Reflect.apply(dialog.showMessageBox, dialog, args)
          closed = options.buttons[response!.response]?.replaceAll('&', '') === 'Discard'
        }
      },
    },
    waitForIdle: async () => {},
  }
  const reporter = IssueReporter.create({
    electronApp: { evaluate: async (expression: string) => runInContext(expression, context) },
    expect: () => ({
      toBeHidden: async () => {
        // The native dialog must stay mocked until the editor has finished closing.
        expect(dialog.showMessageBox).not.toBe(originalDialog)
        if (failAfterClose) {
          throw new Error('reporter did not close')
        }
        expect(closed).toBe(true)
      },
      toBeVisible: async () => {},
      toHaveCount: async () => {},
    }),
    ideVersion: { major: 1, minor: 137, patch: 0 },
    page,
    platform: 'linux',
    VError: TestError,
  })
  return { dialog, originalDialog, reporter, response: () => response }
}

test.each([
  { buttons: ['Discard', 'Cancel'], withWindow: true },
  { buttons: ['Cancel', 'Discard'], withWindow: true },
  { buttons: ['&Discard', 'Cancel'], withWindow: false },
])('discards the native dialog with button order $buttons and restores its handler', async ({ buttons, withWindow }) => {
  const fixture = createReporter({ buttons, message: 'Discard issue report?' }, false, withWindow)

  await fixture.reporter.close()

  expect(fixture.response()).toEqual({
    checkboxChecked: false,
    response: buttons.findIndex((button) => button.replaceAll('&', '') === 'Discard'),
  })
  expect(fixture.originalDialog).not.toHaveBeenCalled()
  expect(fixture.dialog.showMessageBox).toBe(fixture.originalDialog)
})

test('restores the native dialog handler when closing the reporter fails', async () => {
  const fixture = createReporter({ buttons: ['Discard', 'Cancel'], message: 'Discard issue report?' }, true)

  await expect(fixture.reporter.close()).rejects.toThrow('reporter did not close')

  expect(fixture.dialog.showMessageBox).toBe(fixture.originalDialog)
})

test.each([
  { buttons: ['Discard', 'Cancel'], message: 'Discard another document?' },
  { buttons: ['Cancel'], message: 'Discard issue report?' },
])('rejects unexpected native dialogs: $message $buttons', async (options) => {
  const fixture = createReporter(options)

  await expect(fixture.reporter.close()).rejects.toThrow(/Unexpected issue reporter close dialog|has no Discard button/)

  expect(fixture.dialog.showMessageBox).toBe(fixture.originalDialog)
})
