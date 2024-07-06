import * as GetConstructorScope from '../src/parts/GetConstructorScope/GetConstructorScope.js'
import { test, expect } from '@jest/globals'

test('not found', () => {
  const parsedNodes = [
    {
      id: 1,
      name: 'Emitter',
    },
  ]
  const graph = {
    1: [],
  }
  const node = parsedNodes[0]
  expect(GetConstructorScope.getConstructorScope(parsedNodes, graph, node)).toBe(undefined)
})

test('ignore unimportant scope', () => {
  const parsedNodes = [
    {
      id: 1,
      name: 'Emitter',
    },
    {
      id: 2,
      name: 'Relay',
    },
  ]
  const graph = {
    1: [],
    2: [
      {
        index: 1,
        name: 'abc',
      },
      {
        index: 0,
        name: 'this',
      },
      {
        index: 0,
        name: 'emitter',
      },
    ],
  }
  const node = parsedNodes[0]
  expect(GetConstructorScope.getConstructorScope(parsedNodes, graph, node)).toEqual({
    id: 2,
    name: 'Relay',
  })
})
