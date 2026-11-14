import { expect, jest, test } from '@jest/globals'
import * as ContextMenu from '../src/parts/ContextMenu/ContextMenu.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test.each([true, false])('selectAndClose activates a toggle once when the menu remains open: %s', async (staysOpen) => {
  let menuVisible = true
  let checked = false
  const item = {
    click: jest.fn(async () => {
      checked = !checked
      menuVisible = staysOpen
    }),
  }
  const menu = {
    isVisible: jest.fn(async () => menuVisible),
    locator: jest.fn(() => item),
  }
  const press = jest.fn(async (_key: string) => {
    menuVisible = false
  })
  const page = {
    keyboard: { press },
    locator: jest.fn(() => menu),
    waitForIdle: jest.fn(async () => {}),
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

  expect(item.click).toHaveBeenCalledTimes(1)
  expect(checked).toBe(true)
  expect(press.mock.calls).toEqual(staysOpen ? [['Escape']] : [])
})
