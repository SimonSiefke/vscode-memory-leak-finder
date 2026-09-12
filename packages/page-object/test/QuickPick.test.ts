import { expect, jest, test } from '@jest/globals'
import * as QuickPick from '../src/parts/QuickPick/QuickPick.ts'

class TestError extends Error {
  constructor(_error: unknown, message: string) {
    super(message)
  }
}

test('show retries when the quick pick input is not ready', async () => {
  const quickPickInput = {}
  const quickPick = {
    isVisible: jest.fn(async () => true),
    locator: jest.fn(() => quickPickInput),
  }
  const press = jest.fn(async (_key: string) => {})
  const page = {
    keyboard: {
      press,
    },
    locator: jest.fn(() => quickPick),
    waitForIdle: jest.fn(async () => {}),
  }
  let inputVisibilityChecks = 0
  const expectElement = jest.fn((element: unknown) => {
    return {
      toBeFocused: jest.fn(async () => {}),
      toBeHidden: jest.fn(async () => {}),
      toBeVisible: jest.fn(async () => {
        if (element === quickPickInput && inputVisibilityChecks++ === 0) {
          throw new Error('quick pick input is not ready')
        }
      }),
    }
  })
  const quickPickPageObject = QuickPick.create({
    electronApp: {},
    expect: expectElement,
    ideVersion: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    page,
    platform: 'linux',
    VError: TestError,
  })

  await quickPickPageObject.show({
    key: 'Control+Shift+P',
    pressKeyOnce: true,
  })

  expect(press).toHaveBeenNthCalledWith(1, 'Control+Shift+P')
  expect(press).toHaveBeenNthCalledWith(2, 'Escape')
  expect(press).toHaveBeenNthCalledWith(3, 'Control+Shift+P')
})
