import { expect, jest, test } from '@jest/globals'
import * as SourceControl from '../src/parts/SourceControl/SourceControl.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

test('closeRepository opens the context menu on the matching repository provider', async () => {
  const actionItem = {
    clickExponential: jest.fn(async () => {}),
  }
  const contextMenu = {
    count: jest.fn(async () => 1),
    isVisible: jest.fn(async () => true),
    locator: jest.fn(() => actionItem),
  }
  const repositoryLabel = {
    click: jest.fn(async () => {}),
    first: jest.fn(function (this: unknown) {
      return this
    }),
  }
  const providerA = {
    click: jest.fn(async (_options: { button: string }) => {}),
    locator: jest.fn((_selector: string, options: { hasExactText: string }) => ({
      count: jest.fn(async () => (options.hasExactText === 'a' ? 1 : 0)),
    })),
  }
  const providerB = {
    click: jest.fn(async (_options: { button: string }) => {}),
    locator: jest.fn(() => ({
      count: jest.fn(async () => 0),
    })),
  }
  const repositoryProviders = {
    count: jest.fn(async () => 2),
    nth: jest.fn((index: number) => [providerA, providerB][index]),
  }
  const page = {
    locator: jest.fn((selector: string) => {
      if (selector === '.sidebar .scm-provider .label-name') {
        return repositoryLabel
      }
      if (selector === '.sidebar .scm-provider') {
        return repositoryProviders
      }
      if (selector === '.context-view.monaco-menu-container .actions-container') {
        return contextMenu
      }
      throw new Error(`Unexpected selector: ${selector}`)
    }),
    waitForIdle: jest.fn(async () => {}),
  }
  const expectElement = jest.fn(() => ({
    toBeFocused: jest.fn(async () => {}),
    toBeHidden: jest.fn(async () => {}),
    toBeVisible: jest.fn(async () => {}),
  }))
  const sourceControl = SourceControl.create({
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

  await sourceControl.closeRepository('a')

  expect(providerA.click).toHaveBeenCalledWith({ button: 'right' })
  expect(providerB.click).not.toHaveBeenCalled()
  expect(repositoryLabel.click).not.toHaveBeenCalled()
})
