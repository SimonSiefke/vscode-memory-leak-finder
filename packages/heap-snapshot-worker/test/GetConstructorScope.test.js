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
  const constructorScopeMap = new Uint32Array([1, 0])
  const node = parsedNodes[0]
  expect(GetConstructorScope.getConstructorScope(parsedNodes, constructorScopeMap, node)).toEqual({
    id: 2,
    name: 'Relay',
  })
})
