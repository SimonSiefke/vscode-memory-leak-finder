import { expect, jest, test } from '@jest/globals'

const open = jest.fn(async (_locator: unknown) => {})
const selectAndClose = jest.fn(async (_option: string) => {})
jest.unstable_mockModule('../src/parts/ContextMenu/ContextMenu.ts', () => ({ create: () => ({ open, selectAndClose }) }))
const TitleBar = await import('../src/parts/TitleBar/TitleBar.ts')

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test.each([true, false])('ensureAccountsWidgetVisible waits for the title bar activity actions (Accounts enabled: %s)', async (enabled) => {
  let activityActionsReady = false
  let accountsEnabled = enabled
  const accounts = { isVisible: async () => activityActionsReady && accountsEnabled }
  const manage = {}
  open.mockClear()
  selectAndClose.mockReset()
  selectAndClose.mockImplementation(async () => {
    accountsEnabled = !accountsEnabled
  })
  const page = {
    locator: (selector: string) => (selector.includes('Accounts') ? accounts : manage),
    waitForIdle: async () => {},
  }
  const expectElement = (element: unknown) => ({
    toBeVisible: async () => {
      if (element === manage) {
        // The layout command returns before the title bar's activity actions render.
        activityActionsReady = true
      } else {
        expect(await accounts.isVisible()).toBe(true)
      }
    },
  })
  const titleBar = TitleBar.create({
    electronApp: {},
    expect: expectElement,
    ideVersion: { major: 1, minor: 146, patch: 0 },
    page,
    platform: 'linux',
    VError: TestError,
  })

  await titleBar.ensureAccountsWidgetVisible()

  expect(selectAndClose).toHaveBeenCalledTimes(enabled ? 0 : 1)
  expect(await accounts.isVisible()).toBe(true)
})
