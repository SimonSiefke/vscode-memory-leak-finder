import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { hasCompleteNodeModulesCache } from '../src/checkVscodeNodeModulesCache.ts'

const writePackageLock = async (directory: string, dependencies: readonly string[] = []): Promise<void> => {
  await writeFile(
    join(directory, 'package-lock.json'),
    JSON.stringify({
      name: 'fixture',
      lockfileVersion: 3,
      requires: true,
      packages: {
        '': {
          dependencies: Object.fromEntries(dependencies.map((dependency) => [dependency, '1.0.0'])),
        },
      },
    }),
  )
}

test('hasCompleteNodeModulesCache returns true when root and nested packages have complete node_modules', async () => {
  const repoPath = await mkdtemp(join(tmpdir(), 'vscode-node-modules-cache-'))
  const nestedPackagePath = join(repoPath, 'extensions', 'example-extension')

  await mkdir(join(repoPath, 'node_modules', 'typescript'), { recursive: true })
  await mkdir(join(nestedPackagePath, 'node_modules', 'esbuild'), { recursive: true })
  await writePackageLock(repoPath, ['typescript'])
  await writePackageLock(nestedPackagePath, ['esbuild'])
  await writeFile(join(repoPath, 'package.json'), JSON.stringify({ name: 'repo' }))
  await writeFile(join(repoPath, 'node_modules', '.package-lock.json'), '{}')
  await mkdir(nestedPackagePath, { recursive: true })
  await writeFile(join(nestedPackagePath, 'package.json'), JSON.stringify({ name: 'example-extension' }))
  await writeFile(join(nestedPackagePath, 'node_modules', '.package-lock.json'), '{}')

  await expect(hasCompleteNodeModulesCache(repoPath)).resolves.toBe(true)
})

test('hasCompleteNodeModulesCache returns false when a nested package cache is incomplete', async () => {
  const repoPath = await mkdtemp(join(tmpdir(), 'vscode-node-modules-cache-'))
  const nestedPackagePath = join(repoPath, 'extensions', 'example-extension')

  await mkdir(join(repoPath, 'node_modules', 'typescript'), { recursive: true })
  await mkdir(join(nestedPackagePath, 'node_modules'), { recursive: true })
  await writePackageLock(repoPath, ['typescript'])
  await writePackageLock(nestedPackagePath, ['esbuild'])
  await writeFile(join(repoPath, 'package.json'), JSON.stringify({ name: 'repo' }))
  await writeFile(join(repoPath, 'node_modules', '.package-lock.json'), '{}')
  await mkdir(nestedPackagePath, { recursive: true })
  await writeFile(join(nestedPackagePath, 'package.json'), JSON.stringify({ name: 'example-extension' }))
  await writeFile(join(nestedPackagePath, 'node_modules', '.package-lock.json'), '{}')

  await expect(hasCompleteNodeModulesCache(repoPath)).resolves.toBe(false)
})
