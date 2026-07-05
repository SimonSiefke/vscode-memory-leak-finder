import { expect, test } from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildLocalVscodeMinified } from '../src/parts/BuildLocalVscodeMinified/BuildLocalVscodeMinified.ts'

test('buildLocalVscodeMinified reuses existing local minified executable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'launch-worker-minified-'))
  try {
    const repoPath = join(root, 'vscode')
    const executablePath = join(root, 'VSCode-linux-x64', 'code-oss')
    await mkdir(repoPath, { recursive: true })
    await mkdir(join(root, 'VSCode-linux-x64'), { recursive: true })
    await writeFile(executablePath, '')

    await expect(buildLocalVscodeMinified('linux', 'x64', repoPath, true)).resolves.toBe(executablePath)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('buildLocalVscodeMinified rejects unsupported platforms', async () => {
  await expect(buildLocalVscodeMinified('darwin', 'x64', '/repos/vscode', false)).rejects.toThrow(
    '--build-vscode-minified is not supported on darwin',
  )
})
