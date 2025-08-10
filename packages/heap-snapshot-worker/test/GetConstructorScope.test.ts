import * as GetConstructorScope from '../src/parts/GetConstructorScope/GetConstructorScope.js'
import { test, expect } from '@jest/globals'

test.skip('getConstructorScope', () => {
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
  const constructorScopeMap = { 0: 1 }
  const edgeMap = { 0: 'constructor' }
  const node = parsedNodes[0]
  expect(GetConstructorScope.getConstructorScope(parsedNodes, constructorScopeMap, edgeMap, node)).toEqual({
    scopeNode: {
      id: 2,
      name: 'Relay',
    },
    scopeEdge: 'constructor',
  })
})
