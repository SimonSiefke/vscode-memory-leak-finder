import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import JSZip from 'jszip'
import { createAllMockDataZip } from '../src/parts/CreateAllMockDataZip/CreateAllMockDataZip.ts'

test('createAllMockDataZip uses compression for repetitive mock data', async () => {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'create-all-mock-data-zip-'))
  const mockRequestsDirectory = join(rootDirectory, '.vscode-mock-requests', 'editor-open')
  const repetitiveContent = '{"items":[' + '"same-value",'.repeat(50_000) + ']}'

  try {
    await mkdir(mockRequestsDirectory, { recursive: true })
    await writeFile(join(mockRequestsDirectory, '0.json'), repetitiveContent)

    const result = await createAllMockDataZip(rootDirectory)
    const zipContent = await readFile(result.outputFilePath)
    const zip = await JSZip.loadAsync(zipContent)
    const zipStat = await stat(result.outputFilePath)

    expect(result.includedDirectories).toEqual(['.vscode-mock-requests'])
    expect(zip.file('.vscode-mock-requests/editor-open/0.json')).toBeDefined()
    expect(zipStat.size).toBeLessThan(Buffer.byteLength(repetitiveContent, 'utf8'))
  } finally {
    await rm(rootDirectory, { force: true, recursive: true })
  }
})
