import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, jest, test } from '@jest/globals'
import { mergeArtifacts, mergeDirectoryContents } from '../src/mergeArtifacts.ts'

test('mergeDirectoryContents continues after a failed copy', async () => {
  const logger = {
    error: jest.fn(),
    log: jest.fn(),
  }
  const copyEntry = jest.fn(async (sourcePath: string, targetPath: string) => {
    if (sourcePath.endsWith('broken.txt')) {
      throw new Error('copy failed')
    }
    void targetPath
  })
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'merge-directory-contents-'))
  const sourceDir = join(workspaceRoot, 'source')
  const targetDir = join(workspaceRoot, 'target')

  await mkdir(sourceDir, { recursive: true })
  await mkdir(targetDir, { recursive: true })
  await writeFile(join(sourceDir, 'broken.txt'), 'broken')
  await writeFile(join(sourceDir, 'passing.txt'), 'passing')

  try {
    const result = await mergeDirectoryContents({
      sourceDir,
      targetDir,
      copyEntry,
      logger,
    })

    expect(result).toEqual({
      copied: 1,
      skipped: 1,
      total: 2,
    })
    expect(copyEntry).toHaveBeenCalledWith(join(sourceDir, 'broken.txt'), join(targetDir, 'broken.txt'))
    expect(copyEntry).toHaveBeenCalledWith(join(sourceDir, 'passing.txt'), join(targetDir, 'passing.txt'))
    expect(logger.error).toHaveBeenCalledTimes(1)
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})

test('mergeArtifacts merges nested and direct linux results into one folder', async () => {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'merge-artifacts-'))
  const targetDir = join(workspaceRoot, '.vscode-memory-leak-finder-results')
  const nestedSourceDir = join(workspaceRoot, 'vscode-memory-leak-finder-results-linux-event-listeners')
  const directSourceDir = join(workspaceRoot, 'vscode-memory-leak-finder-results-linux-array-count')

  try {
    await mkdir(join(nestedSourceDir, '.vscode-memory-leak-finder-results'), { recursive: true })
    await mkdir(directSourceDir, { recursive: true })

    await writeFile(join(nestedSourceDir, '.vscode-memory-leak-finder-results', 'nested.json'), 'nested result')
    await writeFile(join(directSourceDir, 'direct.json'), 'direct result')

    await mergeArtifacts({
      root: workspaceRoot,
      targetDir,
      pattern: 'vscode-memory-leak-finder-results-linux-',
    })

    expect(await readFile(join(targetDir, 'nested.json'), 'utf8')).toEqual('nested result')
    expect(await readFile(join(targetDir, 'direct.json'), 'utf8')).toEqual('direct result')
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true })
  }
})
