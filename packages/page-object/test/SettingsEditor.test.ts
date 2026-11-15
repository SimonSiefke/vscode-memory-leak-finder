import { expect, jest, test } from '@jest/globals'
import * as SettingsEditor from '../src/parts/SettingsEditor/SettingsEditor.ts'

const searchSettings = async (text: string, resultCount: number | 'many' | 'any') => {
  const searchInput = { focus: jest.fn(async () => {}), type: jest.fn(async (_value: string) => {}) }
  const searchCount = {}
  const page = {
    waitForIdle: jest.fn(async () => {}),
    locator: (selector: string) => (selector === '.settings-count-widget' ? searchCount : searchInput),
  }
  const settings = SettingsEditor.create({
    electronApp: {},
    ideVersion: { major: 1, minor: 129, patch: 1 },
    platform: 'linux',
    page,
    VError: class extends Error {
      constructor(error: Error, message: string) {
        super(`${message}: ${error.message}`)
      }
    },
    expect: (element: unknown) => ({
      toBeVisible: async () => {},
      toBeFocused: async () => {},
      toHaveText: async (expected: string | RegExp) => {
        expect(element).toBe(searchCount)
        if (typeof expected === 'string') expect(text).toBe(expected)
        else expect(text).toMatch(expected)
      },
    }),
  })
  await settings.search({ resultCount, value: 'workbench.experimental.modernUI' })
  expect(searchInput.type).toHaveBeenCalledWith('workbench.experimental.modernUI')
}

test.each(['1 Setting Found', '2 Settings Found', '25 Settings Found'])(
  'search accepts a positive result count across versions: %s',
  async (label) => {
    await searchSettings(label, 'many')
  },
)

test.each(['0 Settings Found', 'No Settings Found'])('search waits for a matching result rather than accepting %s', async (label) => {
  await expect(searchSettings(label, 'many')).rejects.toThrow()
})

test.each([
  [0, '0 Settings Found'],
  [1, '1 Setting Found'],
  [2, '2 Settings Found'],
] as const)('search accepts an exact count of %s', async (count, label) => {
  await searchSettings(label, count)
})

test('search enforces an explicit numeric result count', async () => {
  await expect(searchSettings('3 Settings Found', 2)).rejects.toThrow()
})

test.each(['0 Settings Found', 'No Settings Found', '2 Settings Found'])(
  'search allows feature detection with any result count: %s',
  async (label) => {
    await searchSettings(label, 'any')
  },
)

test('disableCheckBox leaves an already disabled setting unchecked', async () => {
  const checkbox = { getAttribute: jest.fn(async () => 'false') }
  const settings = SettingsEditor.create({
    electronApp: {},
    ideVersion: { major: 1, minor: 100, patch: 0 },
    platform: 'linux',
    page: { waitForIdle: jest.fn(async () => {}), locator: jest.fn(() => checkbox) },
    VError: Error,
    expect: jest.fn(() => ({ toBeVisible: jest.fn(async () => {}) })),
  })
  const toggle = jest.spyOn(settings, 'toggleCheckBox').mockResolvedValue(undefined)

  await settings.disableCheckBox({ name: 'workbench.layoutControl.enabled' })

  expect(toggle).not.toHaveBeenCalled()
})
