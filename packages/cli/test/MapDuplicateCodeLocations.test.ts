import { expect, jest, test } from '@jest/globals'
import { SourceMapConsumer, SourceMapGenerator } from 'source-map'
import { mapDuplicateCodeLocations } from '../src/parts/MapDuplicateCodeLocations/MapDuplicateCodeLocations.ts'

test('maps one-based generated locations to one-based original locations, preserving source roots and names', async () => {
  const map = new SourceMapGenerator({ sourceRoot: 'project', file: 'bundle.js' })
  map.addMapping({ generated: { line: 2, column: 4 }, original: { line: 10, column: 2 }, source: 'src/add.ts', name: 'addition' })
  expect(await mapDuplicateCodeLocations(map.toString(), [2, 5, 2, 9, 1, 1])).toEqual([
    { source: 'project/src/add.ts', line: 10, column: 3, name: 'addition' },
    { source: 'project/src/add.ts', line: 10, column: 3, name: 'addition' },
    null,
  ])
})

test('resolves 80,000 positions with a single consumer', async () => {
  const map = new SourceMapGenerator({ file: 'bundle.js' })
  for (let index = 0; index < 1000; index++) {
    map.addMapping({ generated: { line: 1, column: index * 10 }, original: { line: index + 1, column: 0 }, source: 'src/original.ts' })
  }
  const positions: number[] = []
  for (let index = 0; index < 80_000; index++) positions.push(1, (index % 1000) * 10 + 1)
  const withConsumer = jest.spyOn(SourceMapConsumer, 'with')
  try {
    const results = await mapDuplicateCodeLocations(map.toString(), positions)
    expect(results).toHaveLength(80_000)
    expect(results[0]).toEqual({ source: 'src/original.ts', line: 1, column: 1, name: null })
    expect(results.at(-1)).toEqual({ source: 'src/original.ts', line: 1000, column: 1, name: null })
    expect(withConsumer).toHaveBeenCalledTimes(1)
  } finally {
    withConsumer.mockRestore()
  }
})

test('supports indexed source maps', async () => {
  const map = new SourceMapGenerator()
  map.addMapping({ generated: { line: 1, column: 0 }, original: { line: 8, column: 3 }, source: 'original.ts' })
  const indexed = { version: 3, sections: [{ offset: { line: 2, column: 0 }, map: JSON.parse(map.toString()) }] }
  expect(await mapDuplicateCodeLocations(JSON.stringify(indexed), [3, 1])).toEqual([
    { source: 'original.ts', line: 8, column: 4, name: null },
  ])
})
