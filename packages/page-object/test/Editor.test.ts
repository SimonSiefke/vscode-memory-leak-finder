import { expect, jest, test } from '@jest/globals'
import * as Editor from '../src/parts/Editor/Editor.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test('click rejects when the editor text cannot be clicked', async () => {
  const click = jest.fn(async () => {
    throw new Error('element not found')
  })
  const startTag = {
    click,
  }
  const editor = {
    locator: jest.fn(() => startTag),
  }
  const page = {
    locator: jest.fn(() => editor),
    waitForIdle: jest.fn(async () => {}),
  }
  const expectElement = jest.fn(() => ({
    toBeVisible: jest.fn(async () => {}),
  }))
  const editorPageObject = Editor.create({
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

  await expect(editorPageObject.click('abc')).rejects.toThrow('Failed to click abc: Error: element not found')
})

test('clickCodeLens clicks the matching code lens', async () => {
  const click = jest.fn(async () => {})
  const codeLens = {
    click,
  }
  const page = {
    locator: jest.fn((_selector: string, _options: { hasText: string }) => codeLens),
    waitForIdle: jest.fn(async () => {}),
  }
  const toBeVisible = jest.fn(async (_options?: { timeout: number }) => {})
  const editorPageObject = Editor.create({
    electronApp: {},
    expect: jest.fn(() => ({ toBeVisible })),
    ideVersion: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    page,
    platform: 'linux',
    VError: TestError,
  })

  await editorPageObject.clickCodeLens('Run govulncheck')

  expect(page.locator).toHaveBeenCalledWith('.codelens-decoration', { hasText: 'Run govulncheck' })
  expect(toBeVisible).toHaveBeenCalledWith({ timeout: 120_000 })
  expect(click).toHaveBeenCalledTimes(1)
})
