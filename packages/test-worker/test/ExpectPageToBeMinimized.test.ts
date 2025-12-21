import { expect, jest, test } from '@jest/globals'
import * as DevtoolsCommandType from '../src/parts/DevtoolsCommandType/DevtoolsCommandType.ts'
import * as ExpectPageToBeMinimized from '../src/parts/ExpectPageToBeMinimized/ExpectPageToBeMinimized.ts'

test('execute', async () => {
  const page = {
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
    sessionId: 'test-sessionId',
    targetId: 'test-targetId',
  }
  await ExpectPageToBeMinimized.toBeMinimized(page)
  expect(page.electronRpc.invoke).toHaveBeenCalledTimes(1)
  // @ts-ignore
  expect(page.electronRpc.invoke).toHaveBeenCalledWith(DevtoolsCommandType.RuntimeCallFunctionOn, {
    arguments: [
      {
        value: 'test-targetId',
      },
    ],
    awaitPromise: true,
    functionDeclaration: expect.any(String),
    objectId: 'test-electronObjectId',
    returnByValue: true,
  })
})
