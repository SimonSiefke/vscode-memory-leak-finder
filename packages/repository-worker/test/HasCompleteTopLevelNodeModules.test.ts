import { afterEach, expect, test } from '@jest/globals'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import * as os from 'node:os'
import { hasCompleteTopLevelNodeModules } from '../src/parts/HasCompleteTopLevelNodeModules/HasCompleteTopLevelNodeModules.ts'
import * as Path from '../src/parts/Path/Path.ts'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directory) => {
      const { rm } = await import('node:fs/promises')
      await rm(directory, { force: true, recursive: true })
    }),
  )
})

const createRepo = async (): Promise<string> => {
  const directory = await mkdtemp(Path.join(os.tmpdir(), 'vscode-node-modules-validity-'))
  temporaryDirectories.push(directory)
  return directory
}

test('hasCompleteTopLevelNodeModules returns true when all top-level dependencies exist', async () => {
  const repoPath = await createRepo()
  const nodeModulesPath = Path.join(repoPath, 'node_modules')

  await mkdir(Path.join(nodeModulesPath, '@scope', 'package-a'), { recursive: true })
  await mkdir(Path.join(nodeModulesPath, 'plain-package'), { recursive: true })
  await writeFile(
    Path.join(repoPath, 'package-lock.json'),
    JSON.stringify({
      packages: {
        '': {
          dependencies: {
            '@scope/package-a': '^1.0.0',
          },
          devDependencies: {
            'plain-package': '^1.0.0',
          },
        },
      },
    }),
  )
  await writeFile(Path.join(nodeModulesPath, '.package-lock.json'), '{}')

  await expect(hasCompleteTopLevelNodeModules(repoPath)).resolves.toBe(true)
})

test('hasCompleteTopLevelNodeModules returns false when a top-level dependency is missing', async () => {
  const repoPath = await createRepo()
  const nodeModulesPath = Path.join(repoPath, 'node_modules')

  await mkdir(Path.join(nodeModulesPath, 'present-package'), { recursive: true })
  await writeFile(
    Path.join(repoPath, 'package-lock.json'),
    JSON.stringify({
      packages: {
        '': {
          dependencies: {
            'missing-package': '^1.0.0',
            'present-package': '^1.0.0',
          },
        },
      },
    }),
  )
  await writeFile(Path.join(nodeModulesPath, '.package-lock.json'), '{}')

  await expect(hasCompleteTopLevelNodeModules(repoPath)).resolves.toBe(false)
})
