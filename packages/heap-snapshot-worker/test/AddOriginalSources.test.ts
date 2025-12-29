import { test, expect } from '@jest/globals'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addOriginalSources } from '../src/parts/AddOriginalSources/AddOriginalSources.ts'

test('addOriginalSources attaches urls from script maps folder without sourcemap worker', async () => {
  // Arrange: write a temp script map file
  const thisDir: string = dirname(fileURLToPath(import.meta.url))
  const packageDir: string = resolve(thisDir, '..')
  const repoRoot: string = resolve(packageDir, '../..')
  const mapsDir: string = join(repoRoot, '.vscode-script-maps')
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
