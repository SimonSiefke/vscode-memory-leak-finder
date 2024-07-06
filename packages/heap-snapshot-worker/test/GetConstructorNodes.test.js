import { expect, test } from '@jest/globals'
import * as GetConstructorNodes from '../src/parts/GetConstructorNodes/GetConstructorNodes.js'

test('getConstructorNodes', () => {
  const parsedNodes = [
    {
      id: 1,
      name: 'a',
    },
    {
      id: 2,
      name: 'Emitter',
    },
  ]
  const constructorName = 'Emitter'
  expect(GetConstructorNodes.getConstructorNodes(parsedNodes, constructorName)).toEqual([
    {
      id: 2,
      name: 'Emitter',
    },
  ])
})
