import { expect, test } from '@jest/globals'
import * as CommandMap from '../src/parts/CommandMap/CommandMap.js'

test('commandMap contains Stdout.write function', () => {
  expect(CommandMap.commandMap).toBeDefined()
})
