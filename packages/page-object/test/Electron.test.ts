import { expect, jest, test } from '@jest/globals'
import * as Electron from '../src/parts/Electron/Electron.ts'

class TestError extends Error {
  constructor(error: unknown, message: string) {
    super(`${message}: ${error}`)
  }
}

const createElectronPageObject = (evaluate: (expression: string) => Promise<unknown>) => {
  const waitForIdle = jest.fn(async () => {})
  const electron = Electron.create({
    electronApp: {
      evaluate,
    },
    expect: {},
    ideVersion: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    page: {
      waitForIdle,
    },
    platform: 'linux',
    VError: TestError,
  })
  return { electron, waitForIdle }
}

test('setWindowWidth preserves the other window bounds', async () => {
  const evaluate = jest.fn(async (_expression: string) => 1000)
  const { electron, waitForIdle } = createElectronPageObject(evaluate)

  await electron.setWindowWidth(1000)

  expect(evaluate).toHaveBeenCalledTimes(1)
  expect(evaluate.mock.calls[0][0]).toContain('...bounds,\n    width: 1000')
  expect(waitForIdle).toHaveBeenCalledTimes(1)
})

test('resizeWindowWidth resizes by one pixel with the requested delay', async () => {
  const expressions: string[] = []
  const evaluate = jest.fn(async (expression: string) => {
    expressions.push(expression)
    if (expression.startsWith('globalThis[')) {
      return {
        status: 'resolved',
        width: 600,
      }
    }
    return undefined
  })
  const { electron, waitForIdle } = createElectronPageObject(evaluate)

  await electron.resizeWindowWidth({
    stepDelay: 16,
    width: 600,
  })

  expect(expressions[0]).toContain('const targetWidth = 600')
  expect(expressions[0]).toContain('width += direction')
  expect(expressions[0]).toContain('setTimeout(resolve, stepDelay)')
  expect(waitForIdle).toHaveBeenCalledTimes(1)
})

test('resizeWindowWidth rejects invalid widths', async () => {
  const evaluate = jest.fn(async (_expression: string) => undefined)
  const { electron } = createElectronPageObject(evaluate)

  await expect(electron.resizeWindowWidth({ width: 0 })).rejects.toThrow(
    'Failed to resize window to width 0: TypeError: Window width must be a positive integer',
  )
  expect(evaluate).not.toHaveBeenCalled()
})
