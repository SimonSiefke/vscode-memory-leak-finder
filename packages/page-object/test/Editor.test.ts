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
