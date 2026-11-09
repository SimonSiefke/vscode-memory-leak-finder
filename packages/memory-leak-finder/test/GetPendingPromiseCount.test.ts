import { expect, test } from '@jest/globals'
import { getPendingPromiseCount } from '../src/parts/GetPendingPromiseCount/GetPendingPromiseCount.ts'
import type { Session } from '../src/parts/Session/Session.ts'

test.each([
  { states: ['pending', 'fulfilled', 'rejected', 'pending'], expected: 2 },
  { states: ['fulfilled', 'fulfilled', 'rejected'], expected: 0 },
  { states: [undefined, 'pending'], expected: 1 },
  { states: [], expected: 0 },
])('counts only pending promises in $states', async ({ states, expected }) => {
  const releasedGroups: string[] = []
  const session = {
    dispose() {},
    async invoke(method: string, options: any) {
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
                value: value === undefined ? {} : { preview: { properties: [{ name: '[[PromiseState]]', value }] } },
              })),
            },
          }
        case 'Runtime.releaseObjectGroup':
          releasedGroups.push(options.objectGroup)
          return { result: {} }
        default:
          throw new Error(`Unexpected method: ${method}`)
      }
    },
  } as Session
  expect(await getPendingPromiseCount(session, 'test-group')).toBe(expected)
  expect(releasedGroups).toEqual(['test-group'])
})

test('releases temporary promise references when querying fails', async () => {
  const methods: string[] = []
  const session = {
    async invoke(method: string) {
      methods.push(method)
      if (method === 'Runtime.evaluate') return { result: { result: { objectId: 'prototype' } } }
      if (method === 'Runtime.releaseObjectGroup') return { result: {} }
      throw new Error('query failed')
    },
  } as unknown as Session
  await expect(getPendingPromiseCount(session, 'test-group')).rejects.toThrow('query failed')
  expect(methods.at(-1)).toBe('Runtime.releaseObjectGroup')
})
