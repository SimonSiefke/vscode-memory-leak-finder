import * as GetConstructorScopeMap from '../src/parts/GetConstructorScopeMap/GetConstructorScopeMap.js'
import { test, expect } from '@jest/globals'

test('getConstructorScopeMap', () => {
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
        name: 'emitter',
        index: 0,
      },
    ],
  }
  const scopeMap = GetConstructorScopeMap.getConstructorScopeMap(parsedNodes, graph)
  const scopeMapArray = [...scopeMap]
  expect(scopeMapArray).toEqual([1, 0])
})

test('ignore unimportant scopes', () => {
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
        index: 0,
        name: 'this',
      },
      {
        name: 'emitter',
        index: 0,
      },
    ],
  }
  const scopeMap = GetConstructorScopeMap.getConstructorScopeMap(parsedNodes, graph)
  const scopeMapArray = [...scopeMap]
  expect(scopeMapArray).toEqual([1, 0])
})
