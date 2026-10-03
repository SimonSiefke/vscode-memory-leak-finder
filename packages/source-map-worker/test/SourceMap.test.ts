import { expect, test } from '@jest/globals'
import { SourceMapGenerator } from 'source-map'
import { getOriginalPositions } from '../src/parts/SourceMap/SourceMap.ts'

test('gets source positions without resolving extended original names', async () => {
  const generator = new SourceMapGenerator({ file: 'bundle.js' })
  generator.addMapping({
    generated: {
      column: 1,
      line: 1,
    },
    name: 'render',
    original: {
      column: 3,
      line: 7,
    },
    source: 'src/workbench.ts',
  })

  const sourceMap = JSON.parse(generator.toString())
  const result = await getOriginalPositions(sourceMap, [0, 0], false, 'source-map-hash')

  expect(result).toEqual([
    {
      column: 3,
      line: 7,
      name: 'render',
      source: 'src/workbench.ts',
      sourcesHash: 'source-map-hash',
    },
  ])
})
