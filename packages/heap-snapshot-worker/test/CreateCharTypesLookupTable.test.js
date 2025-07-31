import { test, expect } from '@jest/globals'
import { createCharTypesLookupTable } from '../src/parts/CreateCharTypesLookupTable/CreateCharTypesLookupTable.js'

test('createCharTypesLookupTable - creates correct lookup table', () => {
  const charTypes = createCharTypesLookupTable()

  // Test digit characters (0-9)
  for (let i = 48; i <= 57; i++) {
    expect(charTypes[i]).toBe(1) // DIGIT
  }

  // Test separator characters
  expect(charTypes[44]).toBe(2) // comma
  expect(charTypes[32]).toBe(2) // space
  expect(charTypes[9]).toBe(2)  // tab
  expect(charTypes[10]).toBe(2) // newline

  // Test closing bracket
  expect(charTypes[93]).toBe(3) // ']'

  // Test other characters
  expect(charTypes[65]).toBe(0) // 'A'
  expect(charTypes[97]).toBe(0) // 'a'
  expect(charTypes[33]).toBe(0) // '!'
  expect(charTypes[64]).toBe(0) // '@'
})

test('createCharTypesLookupTable - returns Uint8Array of correct size', () => {
  const charTypes = createCharTypesLookupTable()

  expect(charTypes).toBeInstanceOf(Uint8Array)
  expect(charTypes.length).toBe(128)
})