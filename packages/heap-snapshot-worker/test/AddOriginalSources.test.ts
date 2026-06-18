import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { SourceMapGenerator } from 'source-map'
import { addOriginalSources } from '../src/parts/AddOriginalSources/AddOriginalSources.ts'
import { root } from '../src/parts/Root/Root.ts'

test('addOriginalSources attaches urls from script maps folder without sourcemap worker', async () => {
  // Arrange: write a temp script map file
  const mapsDir: string = join(root, '.vscode-script-maps')
  await mkdir(mapsDir, { recursive: true })
  const mapPath: string = join(mapsDir, 'tmp-test.json')
  const scriptMap = {
    1: { sourceMapUrl: '', url: 'file:///bundle1.js' },
    2: { sourceMapUrl: '', url: 'file:///bundle2.js' },
  }
  await writeFile(mapPath, JSON.stringify(scriptMap), 'utf8')

  const items: readonly any[] = [
    { column: 10, count: 5, delta: 2, line: 20, name: 'fnA', scriptId: 1 },
    { column: 15, count: 8, delta: 3, line: 25, name: 'fnB', scriptId: 2 },
  ]

  const result = await addOriginalSources(items)

  expect(result).toHaveLength(2)

  expect(result[0]).toMatchObject({
    sourceMapUrl: '',
    url: 'file:///bundle1.js',
  })

  expect(result[1]).toMatchObject({
    sourceMapUrl: '',
    url: 'file:///bundle2.js',
  })

  // original fields should be absent since no sourcemap url was provided
  expect(result[0].originalUrl).toBeUndefined()
  expect(result[1].originalUrl).toBeUndefined()
  // Cleanup: remove temp file
  await rm(mapPath)
})

test('addOriginalSources attaches original locations from relative source maps', async () => {
  const mapsDir: string = join(root, '.vscode-script-maps')
  await mkdir(mapsDir, { recursive: true })
  const mapPath: string = join(mapsDir, 'tmp-relative-source-map-test.json')
  const tempDir = await mkdtemp(join(tmpdir(), 'source-map-test-'))
  const generatedPath = join(tempDir, 'bundle.js')
  const sourcePath = '../../node_modules/.pnpm/pkg/source.ts'
  const generatedMap = new SourceMapGenerator({
    file: 'bundle.js',
  })
  generatedMap.addMapping({
    generated: {
      column: 11,
      line: 2,
    },
    name: 'makeLeak',
    original: {
      column: 3,
      line: 7,
    },
    source: sourcePath,
  })
  generatedMap.setSourceContent(sourcePath, 'export function makeLeak() {}')
  await writeFile(join(tempDir, 'bundle.js.map'), generatedMap.toString(), 'utf8')
  const scriptMap = {
    9001: {
      sourceMapUrl: 'bundle.js.map',
      url: pathToFileURL(generatedPath).toString(),
    },
  }
  await writeFile(mapPath, JSON.stringify(scriptMap), 'utf8')

  const result = await addOriginalSources([{ column: 10, count: 5, delta: 2, line: 1, name: 'm', scriptId: 9001 }])

  expect(result[0]).toMatchObject({
    originalLocation: 'node_modules/.pnpm/pkg/source.ts:7:3',
    originalName: 'makeLeak',
    sourceLocation: `${pathToFileURL(generatedPath).toString()}:1:10`,
    sourceMapUrl: pathToFileURL(join(tempDir, 'bundle.js.map')).toString(),
  })

  await rm(mapPath)
  await rm(tempDir, { recursive: true })
})
