import { expect, jest, test } from '@jest/globals'
import * as DevtoolsCommandType from '../src/parts/DevtoolsCommandType/DevtoolsCommandType.js'
import * as ExpectPageToBeMinimized from '../src/parts/ExpectPageToBeMinimized/ExpectPageToBeMinimized.js'

test('execute', async () => {
  const page = {
    sessionId: 'test-sessionId',
    targetId: 'test-targetId',
    electronObjectId: 'test-electronObjectId',
    electronRpc: {
      invoke: jest.fn(() => {
        return {
          result: {
            result: {
              result: {},
            },
          },
        }
      }),
    },
  }
  await ExpectPageToBeMinimized.toBeMinimized(page)
  expect(page.electronRpc.invoke).toHaveBeenCalledTimes(1)
  expect(page.electronRpc.invoke).toHaveBeenCalledWith(DevtoolsCommandType.RuntimeCallFunctionOn, {
    arguments: [
      {
        value: 'test-targetId',
      },
    ],
    functionDeclaration: expect.any(String),
    awaitPromise: true,
    objectId: 'test-electronObjectId',
    returnByValue: true,
  })
})
