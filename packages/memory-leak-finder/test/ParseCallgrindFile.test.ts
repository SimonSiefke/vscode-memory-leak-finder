import { expect, test } from '@jest/globals'
import * as ParseCallgrindFile from '../src/parts/ParseCallgrindFile/ParseCallgrindFile.ts'

test('parseCallgrindFile - instruction references', () => {
  const content = `events: Ir Dr Dw
summary: 42 5 7
`
  expect(ParseCallgrindFile.parseCallgrindFile(content)).toEqual({
    events: ['Ir', 'Dr', 'Dw'],
    instructionReferences: 42,
  })
})

test('parseCallgrindFile - missing summary', () => {
  const content = `events: Ir
`
  expect(ParseCallgrindFile.parseCallgrindFile(content)).toBeUndefined()
})

test('parseCallgrindFile - missing Ir event', () => {
  const content = `events: Dr Dw
summary: 5 7
`
  expect(ParseCallgrindFile.parseCallgrindFile(content)).toBeUndefined()
})
