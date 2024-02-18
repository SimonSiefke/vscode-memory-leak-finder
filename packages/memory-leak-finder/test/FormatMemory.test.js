import * as FormatMemory from '../src/parts/FormatMemory/FormatMemory.js'

test('formatMemory', async () => {
  const bytes = 1111
  expect(await FormatMemory.formatMemory(bytes)).toBe('1.11 kB')
})
