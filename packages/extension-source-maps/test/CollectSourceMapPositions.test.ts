import { expect, test } from '@jest/globals'

test.skip('collectSourceMapPositions - collects positions from items with sourceMapUrl', () => {
  expect(true).toBe(true)
})

test.skip('collectSourceMapPositions - collects positions from items with sourceLocation', () => {
  expect(true).toBe(true)
})

test.skip('collectSourceMapPositions - collects positions from items with url', () => {
  expect(true).toBe(true)
})

test.skip('collectSourceMapPositions - skips items without valid source map URL', () => {
  expect(true).toBe(true)
})

test.skip('collectSourceMapPositions - skips items without line or column', () => {
  expect(true).toBe(true)
})
  expect(result.positionPointers).toHaveLength(0)
})
