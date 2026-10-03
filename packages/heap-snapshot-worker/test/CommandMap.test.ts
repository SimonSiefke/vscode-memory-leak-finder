import { test, expect } from '@jest/globals'
import * as CommandMap from '../src/parts/CommandMap/CommandMap.js'

test('commandMap', () => {
  expect(typeof CommandMap.commandMap).toBe('object')
})
