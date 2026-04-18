import { expect, test } from '@jest/globals'
import * as GetRemoteObjectLength from '../src/parts/GetRemoteObjectLength/GetRemoteObjectLength.ts'

test('getRemoteObjectLength requests returnByValue', async () => {
  const invocations: any[] = []
  const session = {
    invoke(method: string, params: any) {
      invocations.push({ method, params })
      return Promise.resolve({
        result: {
          result: {
            type: 'number',
            value: 3,
          },
        },
      })
    },
  }

  const result = await GetRemoteObjectLength.getRemoteObjectLength(session as any, 'object-1', 'group-1')

  expect(result).toBe(3)
  expect(invocations).toEqual([
    {
      method: 'Runtime.callFunctionOn',
      params: {
        functionDeclaration: `function (){
  const elements = this
  return elements.length
}`,
        objectGroup: 'group-1',
        objectId: 'object-1',
        returnByValue: true,
      },
    },
  ])
})
