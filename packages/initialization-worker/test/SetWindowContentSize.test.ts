import { expect, test } from '@jest/globals'
import * as SetWindowContentSize from '../src/parts/SetWindowContentSize/SetWindowContentSize.ts'

test('setWindowContentSize resizes the window for the target web contents', async () => {
  const calls: Array<{ method: string; params: any }> = []
  const electronRpc = {
    invoke: async (method: string, params: any) => {
      calls.push({ method, params })
      return {
        result: {
          result: {
            type: 'undefined',
          },
        },
      }
    },
  }

  await SetWindowContentSize.setWindowContentSize(electronRpc, 'electron-object', 'target-id', 1024, 768)

  expect(calls).toEqual([
    {
      method: 'Runtime.callFunctionOn',
      params: {
        arguments: [{ value: 'target-id' }, { value: 1024 }, { value: 768 }],
        awaitPromise: true,
        functionDeclaration: expect.stringContaining('browserWindow.setContentSize(width, height, false)'),
        objectId: 'electron-object',
      },
    },
  ])
})
