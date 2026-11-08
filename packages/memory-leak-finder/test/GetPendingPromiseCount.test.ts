import { expect, test } from '@jest/globals'
import { getPendingPromiseCount } from '../src/parts/GetPendingPromiseCount/GetPendingPromiseCount.ts'
import type { Session } from '../src/parts/Session/Session.ts'

test.each([
  { states: ['pending', 'fulfilled', 'rejected', 'pending'], expected: 2 },
  { states: ['fulfilled', 'fulfilled', 'rejected'], expected: 0 },
  { states: [], expected: 0 },
])('counts only pending promises in $states', async ({ states, expected }) => {
  const session = {
    dispose() {},
    async invoke(method: string) {
      switch (method) {
        case 'Runtime.evaluate':
          return { result: { result: { objectId: 'prototype' } } }
        case 'Runtime.queryObjects':
          return { result: { objects: { objectId: 'promises' } } }
        case 'Runtime.getProperties':
          return {
            result: {
              internalProperties: [],
              result: states.map((value, index) => ({
                name: String(index),
                enumerable: true,
                value: { preview: { properties: [{ name: '[[PromiseState]]', value }] } },
              })),
            },
          }
        default:
          throw new Error(`Unexpected method: ${method}`)
      }
    },
  } as Session
  expect(await getPendingPromiseCount(session, 'test-group')).toBe(expected)
})
