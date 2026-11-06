import { expect, test } from '@jest/globals'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadSourceMap } from '../src/parts/LoadSourceMapFromUrl/LoadSourceMapFromUrl.ts'
import * as Root from '../src/parts/Root/Root.ts'

test('restores extracted source files when the normalized source map cache hits', async () => {
  const hash = `source-map-cache-test-${process.pid}-${Date.now()}`
  const sourceMapDir = join(Root.root, '.vscode-source-maps')
  const sourcesDir = join(Root.root, '.vscode-sources', hash)
  const normalizedPath = join(sourceMapDir, `${hash}.js.map`)
  const originalPath = `${normalizedPath}.original`
  const sourcePath = join(sourcesDir, 'src', 'quickDiffModel.ts')
  await mkdir(sourceMapDir, { recursive: true })
  await mkdir(join(sourcesDir, 'src'), { recursive: true })
  try {
    await writeFile(normalizedPath, JSON.stringify({ version: 3, sources: ['src/quickDiffModel.ts'], sourcesContent: [] }))
    await writeFile(
      originalPath,
      JSON.stringify({ version: 3, sources: ['src/quickDiffModel.ts'], sourcesContent: ['const restoredSource = true'] }),
    )
    expect(existsSync(sourcePath)).toBe(false)

    const sourceMap = await loadSourceMap('unused-on-cache-hit', hash)

    expect(sourceMap.sources).toEqual(['src/quickDiffModel.ts'])
    expect(await readFile(sourcePath, 'utf8')).toBe('const restoredSource = true')
  } finally {
    await rm(normalizedPath, { force: true })
    await rm(originalPath, { force: true })
    await rm(sourcesDir, { recursive: true, force: true })
  }
})
