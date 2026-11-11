import { expect, jest, test } from '@jest/globals'
import type { Session } from '../src/parts/Session/Session.ts'
import { getEmptySetCount } from '../src/parts/GetEmptySetCount/GetEmptySetCount.ts'
import { getMeasure } from '../src/parts/GetMeasure/GetMeasure.ts'
import * as measure from '../src/parts/MeasureEmptySetCount/MeasureEmptySetCount.ts'

const createSession = (objects: unknown[], failQuery = false) => {
  const invoke = jest.fn(async (method: string, options: any): Promise<any> => {
    switch (method) {
      case 'Runtime.evaluate':
        return { result: { result: { type: 'object', objectId: 'prototype' } } }
      case 'Runtime.queryObjects':
        if (failQuery) throw new Error('query failed')
        return { result: { objects: { objectId: 'objects' } } }
      case 'Runtime.callFunctionOn': {
        const count = Reflect.apply(new Function('return (' + options.functionDeclaration + ')')(), objects, [])
        return { result: { result: { type: 'number', value: count } } }
      }
      case 'Runtime.releaseObjectGroup':
        return { result: {} }
      default:
        throw new Error(method)
    }
  })
  return { session: { invoke } as unknown as Session, invoke }
}

test('counts genuinely empty Sets without invoking overridden size accessors', async () => {
  class CustomSet extends Set {
    get size(): number {
      throw new Error('application getter must not run')
    }
  }
  const { session, invoke } = createSession([
    new Set(),
    new Set(['value']),
    new CustomSet(),
    new CustomSet(['value']),
    CustomSet.prototype,
    Object.create(Set.prototype),
  ])
  expect(await getEmptySetCount(session)).toBe(2)
  expect(invoke.mock.calls.at(-1)?.[0]).toBe('Runtime.releaseObjectGroup')
  const group = invoke.mock.calls[0]![1].objectGroup
  expect(invoke.mock.calls.every(([, options]) => options.objectGroup === group)).toBe(true)
})

test('releases temporary heap references when querying fails', async () => {
  const { session, invoke } = createSession([], true)
  await expect(getEmptySetCount(session)).rejects.toThrow('query failed')
  expect(invoke.mock.calls.at(-1)?.[0]).toBe('Runtime.releaseObjectGroup')
})

test('reports zero and resolves the public measure name', async () => {
  const { session } = createSession([])
  expect(await getEmptySetCount(session)).toBe(0)
  expect(getMeasure({ Measures: { measure } }, 'empty-set-count')).toBe(measure)
  expect(measure.isLeak(measure.compare(1, 2))).toBe(true)
  expect(measure.isLeak(measure.compare(2, 1))).toBe(false)
})
