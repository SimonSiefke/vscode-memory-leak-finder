import { test, expect } from '@jest/globals'
import type { Session } from '../src/parts/Session/Session.ts'
import * as GetFunctionLocation from '../src/parts/GetFunctionLocation/GetFunctionLocation.ts'

test('getFunctionLocation', async () => {
  const session: Session = {
    dispose() {},
    async invoke<T = unknown>(): Promise<T> {
      return {
        result: {
          result: {
            internalProperties: [
              {
                name: '[[FunctionLocation]]',
                value: {
                  description: 'Object',
                  subtype: 'internal#location',
                  type: 'object',
                  value: { columnNumber: 2776, lineNumber: 1552, scriptId: '16' },
                },
              },
            ],
          },
        },
      } as T
    },
  }
  const objectId = 'test-123'
  expect(await GetFunctionLocation.getFunctionLocation(session, objectId)).toEqual({ columnNumber: 2776, lineNumber: 1552, scriptId: '16' })
})
