import { expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/parts/QuickPick/QuickPick.ts', () => ({
  create: () => ({ executeCommand: async () => {} }),
}))

const RunningExtensions = await import('../src/parts/RunningExtensions/RunningExtensions.ts')

test('showAndWaitFor waits until extension activation finishes', async () => {
  const activation = Promise.withResolvers<void>()
  const waiting = Promise.withResolvers<void>()
  const activationTime = { click: async () => {} }
  const page = {
    waitForIdle: async () => {},
    locator: jest.fn((_selector: string) => activationTime),
  }
  const runningExtensions = RunningExtensions.create({
    electronApp: {},
    ideVersion: { major: 1, minor: 129, patch: 1 },
    platform: 'linux',
    page,
    VError: Error,
    expect: (element: object) => ({
      toBeVisible: async () => {},
      toBeHidden: async () => {
        expect(element).toBe(activationTime)
        waiting.resolve()
        await activation.promise
      },
    }),
  })
  let finished = false
  const result = runningExtensions.showAndWaitFor('JSON Language Features', 'typescript-language-features').then(() => {
    finished = true
  })
  await Promise.race([
    waiting.promise,
    result.then(() => {
      throw new Error('Returned before waiting for activation')
    }),
  ])
  expect(finished).toBe(false)
  activation.resolve()
  await result
  expect(finished).toBe(true)
  expect(page.locator).toHaveBeenCalledWith('.runtime-extensions-editor .monaco-list-row[aria-label="typescript-language-features"]')
})
