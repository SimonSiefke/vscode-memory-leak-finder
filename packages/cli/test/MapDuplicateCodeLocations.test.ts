import { expect, jest, test } from '@jest/globals'
import { SourceMapConsumer, SourceMapGenerator } from 'source-map'
import { mapDuplicateCodeLocations } from '../src/parts/MapDuplicateCodeLocations/MapDuplicateCodeLocations.ts'

test('maps one-based generated locations to one-based original locations, preserving source roots and names', async () => {
  const map = new SourceMapGenerator({ sourceRoot: 'project', file: 'bundle.js' })
  map.addMapping({ generated: { line: 2, column: 4 }, original: { line: 10, column: 2 }, source: 'src/add.ts', name: 'addition' })
  expect(await mapDuplicateCodeLocations(map.toString(), [2, 5, 2, 9, 1, 1])).toEqual([
    { source: 'project/src/add.ts', line: 10, column: 3, name: 'addition', preview: null },
    { source: 'project/src/add.ts', line: 10, column: 3, name: 'addition', preview: null },
    null,
  ])
})

test('resolves 80,000 positions with a single consumer', async () => {
  const map = new SourceMapGenerator({ file: 'bundle.js' })
  for (let index = 0; index < 1000; index++) {
    map.addMapping({ generated: { line: 1, column: index * 10 }, original: { line: index + 1, column: 0 }, source: 'src/original.ts' })
  }
  map.setSourceContent(
    'src/original.ts',
    Array.from({ length: 1000 }, (_, index) => `function original${index}() { return ${index} }`).join('\n'),
  )
  const positions: number[] = []
  for (let index = 0; index < 80_000; index++) positions.push(1, (index % 1000) * 10 + 1)
  const withConsumer = jest.spyOn(SourceMapConsumer, 'with')
  try {
    const results = await mapDuplicateCodeLocations(map.toString(), positions)
    expect(results).toHaveLength(80_000)
    expect(results[0]).toEqual({ source: 'src/original.ts', line: 1, column: 1, name: null, preview: 'function original0() { return 0 }' })
    expect(results.at(-1)).toEqual({
      source: 'src/original.ts',
      line: 1000,
      column: 1,
      name: null,
      preview: 'function original999() { return 999 }',
    })
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
    { source: 'original.ts', line: 8, column: 4, name: null, preview: null },
  ])
})

test('previews start at the mapped column, follow mixed line endings, and preserve lookup order', async () => {
  const map = new SourceMapGenerator()
  const contents = 'prefix const add = (x: number) => {\r\n\treturn x + 1;\u2028};\r\nfunction other() {}'
  map.setSourceContent('original.ts', contents)
  map.addMapping({ generated: { line: 1, column: 0 }, original: { line: 1, column: 7 }, source: 'original.ts' })
  map.addMapping({ generated: { line: 2, column: 0 }, original: { line: 4, column: 0 }, source: 'original.ts' })
  map.setSourceContent('iterator.ts', '[Symbol.iterator]() { /* no-op */ },\nnext() { return value; }')
  map.addMapping({ generated: { line: 3, column: 0 }, original: { line: 1, column: 16 }, source: 'iterator.ts' })
  const result = await mapDuplicateCodeLocations(map.toString(), [2, 1, 1, 1, 3, 1])
  expect(result[0]?.preview).toBe('function other() {}')
  expect(result[1]?.preview).toBe('const add = (x: number) => {\n\treturn x + 1;\n};')
  expect(result[2]?.preview).toBe(']() { /* no-op */ },')
})

test('bounds previews by character and line count and ignores invalid original positions', async () => {
  const map = new SourceMapGenerator()
  map.setSourceContent('long.ts', 'function long() {\n' + '  work();\n'.repeat(100) + '}')
  map.setSourceContent('wide.ts', 'const wide = () => "' + 'x'.repeat(10_000) + '";')
  map.addMapping({ generated: { line: 1, column: 0 }, original: { line: 1, column: 0 }, source: 'long.ts' })
  map.addMapping({ generated: { line: 2, column: 0 }, original: { line: 1, column: 0 }, source: 'wide.ts' })
  map.addMapping({ generated: { line: 3, column: 0 }, original: { line: 1000, column: 0 }, source: 'long.ts' })
  const result = await mapDuplicateCodeLocations(map.toString(), [1, 1, 2, 1, 3, 1])
  expect(result[0]?.preview?.split('\n')).toHaveLength(5)
  expect(result[1]?.preview).toHaveLength(300)
  expect(result[2]?.preview).toBeNull()
})
