import { afterEach, expect, jest, test } from '@jest/globals'
import * as GetIpcMessages from '../src/parts/GetIpcMessages/GetIpcMessages.ts'

afterEach(() => {
  jest.restoreAllMocks()
})

test('getIpcMessages returns cleaned ipc messages without logging raw messages', async () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  const messages = [
    {
      args: ['{"text":"hello"}'],
      channel: 'test-channel',
      timestamp: 1,
      type: 'on',
    },
  ]
  const calls: unknown[] = []
  const session = {
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      return Promise.resolve({
        result: {
          result: {
            value: messages,
          },
        },
      })
    },
  } as any

  const result = await GetIpcMessages.getIpcMessages(session)

  expect(result).toEqual([
    {
      args: [{ text: 'hello' }],
      channel: 'test-channel',
      timestamp: 1,
      type: 'on',
    },
  ])
  expect(calls).toEqual([
    [
      'Runtime.evaluate',
      {
        expression: 'globalThis.__ipcMessages || []',
        generatePreview: true,
        returnByValue: true,
      },
    ],
  ])
  expect(consoleLogSpy).not.toHaveBeenCalled()
})
