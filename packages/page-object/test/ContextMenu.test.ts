import { expect, jest, test } from '@jest/globals'
import * as ContextMenu from '../src/parts/ContextMenu/ContextMenu.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test.each([
  [true, false],
  [false, false],
  [true, true],
  [false, true],
])('selectAndClose activates a toggle once (persistent: %s, deferred mouse action: %s)', async (staysOpen, deferredMouseAction) => {
  let menuVisible = true
  let checked = false
  let rendererMouseHandlerReady = false
  const pending: Promise<void>[] = []
  const activate = jest.fn(() => {
    checked = !checked
    menuVisible = staysOpen
  })
  const item = {
    click: jest.fn(async () => {
      if (!rendererMouseHandlerReady) return
      if (deferredMouseAction) {
        pending.push(
          new Promise((resolve) =>
            setTimeout(() => {
              if (menuVisible) activate()
              resolve()
            }, 0),
          ),
        )
      } else {
        activate()
      }
    }),
  }
  const menu = {
    isVisible: jest.fn(async () => menuVisible),
    locator: jest.fn(() => item),
  }
  const press = jest.fn(async (key: string) => {
    if (key === 'Escape') {
      menuVisible = false
    }
  })
  const page = {
    keyboard: { press },
    locator: jest.fn(() => menu),
    waitForIdle: jest.fn(async () => {}),
    evaluate: jest.fn(async () => {
      rendererMouseHandlerReady = true
      await Promise.all(pending)
    }),
  }
  const expectElement = (element: unknown) => ({
    toBeFocused: async () => {},
    toBeHidden: async () => {
      expect(menuVisible).toBe(false)
    },
    toBeVisible: async () => {
      expect(element === item || menuVisible).toBe(true)
    },
  })
  const contextMenu = ContextMenu.create({
    electronApp: {},
    expect: expectElement,
    ideVersion: { major: 1, minor: 145, patch: 0 },
    page,
    platform: 'linux',
    VError: TestError,
  })

  await contextMenu.selectAndClose('Accounts')
  await Promise.all(pending)

  expect(activate).toHaveBeenCalledTimes(1)
  expect(checked).toBe(true)
  expect(menuVisible).toBe(false)
})
