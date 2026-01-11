import * as CommandMap from '../src/parts/CommandMap/CommandMap.js'
import { test, expect } from '@jest/globals'

test('commandMap', () => {
  expect(typeof CommandMap.commandMap).toBe('object')
})
