import { expect, jest, test } from '@jest/globals'
import * as Panel from '../src/parts/Panel/Panel.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test('show does not toggle an already visible panel', async () => {
  const panelElement = {
    isVisible: jest.fn(async () => true),
  }
  const page = {
    locator: jest.fn(() => panelElement),
  }
  const expectElement = jest.fn(() => ({
    toBeHidden: jest.fn(async () => {
      throw new Error('expected the visible panel not to be checked for hidden state')
    }),
    toBeVisible: jest.fn(async () => {}),
  }))
  const panel = Panel.create({
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
  const toggle = jest.fn(async () => {})
  panel.toggle = toggle

  await panel.show()

  expect(toggle).not.toHaveBeenCalled()
})
