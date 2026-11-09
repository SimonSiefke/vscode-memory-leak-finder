import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'

const executeCommand = jest.fn(async () => {})
jest.unstable_mockModule('../src/parts/QuickPick/QuickPick.ts', () => ({ create: () => ({ executeCommand }) }))
const { create } = await import('../src/parts/Editor/Editor.ts')

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

const fixture = (isVisible: () => Promise<boolean>, message = 'No auto fixes available') => {
  const overlay = { isVisible: jest.fn(isVisible) }
  const toBeVisible = jest.fn(async (_options?: { timeout: number }) => {
    if (!(await overlay.isVisible())) throw new Error('expected selector to be visible .monaco-editor-overlaymessage')
  })
  const toHaveText = jest.fn(async (expected: string) => {
    expect(message).toBe(expected)
  })
  const editor = create({
    electronApp: {},
    expect: () => ({ toBeVisible, toHaveText }),
    ideVersion: { major: 1, minor: 145, patch: 0 },
    page: { locator: () => overlay },
    platform: 'linux',
    VError: TestError,
  })
  return { editor, overlay, toBeVisible, toHaveText }
}
beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})

test('reinvokes a cancelled no-fixes request and still verifies the result', async () => {
  const { editor, toHaveText } = fixture(async () => executeCommand.mock.calls.length >= 2)
  const fixing = editor.autoFix({ hasFixes: false })
  await jest.runAllTimersAsync()
  await fixing
  expect(executeCommand).toHaveBeenCalledTimes(2)
  expect(toHaveText).toHaveBeenCalledWith('No auto fixes available')
})

test('does not repeat an operation that applies fixes', async () => {
  const { editor, overlay } = fixture(async () => true)
  await editor.autoFix({ hasFixes: true })
  expect(executeCommand).toHaveBeenCalledTimes(1)
  expect(overlay.isVisible).not.toHaveBeenCalled()
})

test('a missing result still fails within the bounded message wait', async () => {
  const { editor, toBeVisible } = fixture(async () => false)
  const failed = expect(editor.autoFix({ hasFixes: false })).rejects.toThrow('expected selector to be visible')
  await jest.runAllTimersAsync()
  await failed
  expect(executeCommand).toHaveBeenCalledTimes(4)
  expect(toBeVisible).toHaveBeenCalledWith({ timeout: 1 })
})

test('transport errors are not retried', async () => {
  const { editor } = fixture(async () => {
    throw new Error('renderer connection closed')
  })
  await expect(editor.autoFix({ hasFixes: false })).rejects.toThrow('renderer connection closed')
  expect(executeCommand).toHaveBeenCalledTimes(1)
})

test('an unexpected visible message fails without retrying', async () => {
  const { editor } = fixture(async () => true, 'Unexpected action result')
  await expect(editor.autoFix({ hasFixes: false })).rejects.toThrow()
  expect(executeCommand).toHaveBeenCalledTimes(1)
})
