import { expect, jest, test } from '@jest/globals'
import * as Terminal from '../src/parts/Terminal/Terminal.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test('shouldContainText matches a literal substring or regular expression', async () => {
  const rows = {}
  const terminal = {
    locator: jest.fn((_selector: string) => rows),
  }
  const page = {
    locator: jest.fn((_selector: string) => terminal),
    waitForIdle: jest.fn(async () => {}),
  }
  const toBeVisible = jest.fn(async () => {})
  const toHaveText = jest.fn(async (_value: RegExp, _options: { timeout: number }) => {})
  const terminalPageObject = Terminal.create({
    electronApp: {},
    expect: jest.fn(() => ({ toBeVisible, toHaveText })),
    ideVersion: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    page,
    platform: 'linux',
    VError: TestError,
  })

  await terminalPageObject.shouldContainText('govulncheck -C /tmp/a+b', 1234)

  expect(page.locator).toHaveBeenCalledWith('.terminal.xterm')
  expect(terminal.locator).toHaveBeenCalledWith('.xterm-rows')
  expect(toHaveText).toHaveBeenCalledWith(/govulncheck -C \/tmp\/a\+b/, { timeout: 1234 })

  const completion = /No vulnerabilities found\.|GO-\d{4}-\d+/
  await terminalPageObject.shouldContainText(completion, 5678)
  expect(toHaveText).toHaveBeenLastCalledWith(completion, { timeout: 5678 })
})
