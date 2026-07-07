import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, test } from '@jest/globals'
import {
  computeVscodeNodeModulesCacheKey,
  ensureLocalVscodeBuild,
  getEnsureLocalVscodeBuildActions,
  getLabeledResultPath,
  getLocalVscodeComparisonCacheDir,
  getMeasureCommandArgs,
  getMinifiedExecutablePath,
  getResultPath,
  getResultTestName,
  hasUnstagedChanges,
  parseArgv,
  renameResult,
} from '../src/measureLocalVscodeComparison.ts'

const cacheDirsToRemove: string[] = []

afterEach(async () => {
  await Promise.all(cacheDirsToRemove.splice(0).map((cacheDir) => rm(cacheDir, { force: true, recursive: true })))
})

const createVscodeFixture = async (): Promise<string> => {
  const repoPath = await mkdtemp(join(tmpdir(), 'measure-local-vscode-comparison-vscode-'))
  cacheDirsToRemove.push(getLocalVscodeComparisonCacheDir(repoPath))
  await writeFile(join(repoPath, '.nvmrc'), '22.15.0')
  await writeFile(
    join(repoPath, 'package-lock.json'),
    JSON.stringify({
      packages: {
        '': {
          dependencies: {
            typescript: '1.0.0',
          },
        },
      },
    }),
  )
  await writeFile(join(repoPath, 'package.json'), JSON.stringify({ name: 'vscode' }))
  await mkdir(join(repoPath, 'node_modules', 'typescript'), { recursive: true })
  await writeFile(join(repoPath, 'node_modules', '.package-lock.json'), '{}')
  return repoPath
}

test('parseArgv uses defaults', () => {
  expect(parseArgv([])).toEqual({
    display: ':1',
    measure: 'cpu-performance-counters',
    measureAfter: false,
    newLabel: 'new',
    newVscodePath: '/root/.cache/repos/vscode',
    oldLabel: 'old',
    oldVscodePath: '/root/.cache/repos/vscode-2',
    only: '^editor-open.ts',
    runs: 1,
    skipBuild: false,
    skipCharts: false,
  })
})

test('parseArgv uses overrides', () => {
  expect(
    parseArgv([
      '--old-vscode-path',
      '/tmp/vscode-a',
      '--new-vscode-path',
      '/tmp/vscode-b',
      '--old-label',
      'main',
      '--new-label',
      'branch',
      '--only',
      'chat.ts',
      '--measure',
      'tracked-allocations',
      '--runs',
      '3',
      '--display',
      ':2',
      '--skip-build',
      '--skip-charts',
      '--measure-after',
    ]),
  ).toEqual({
    display: ':2',
    measure: 'tracked-allocations',
    measureAfter: true,
    newLabel: 'branch',
    newVscodePath: '/tmp/vscode-b',
    oldLabel: 'main',
    oldVscodePath: '/tmp/vscode-a',
    only: 'chat.ts',
    runs: 3,
    skipBuild: true,
    skipCharts: true,
  })
})

test('getResultTestName derives names from filters', () => {
  expect(getResultTestName('editor-open.ts')).toBe('editor-open')
  expect(getResultTestName('^editor-open.ts')).toBe('editor-open')
  expect(getResultTestName('editor.open')).toBe('editor-open')
})

test('getResultPath derives measure result path', () => {
  expect(
    getResultPath('cpu-performance-counters', '^editor-open.ts').endsWith(
      join('.vscode-memory-leak-finder-results', 'cpu-performance-counters', 'editor-open.json'),
    ),
  ).toBe(true)
})

test('getMeasureCommandArgs forwards measure-after to cli', () => {
  expect(
    getMeasureCommandArgs(
      {
        display: ':1',
        measure: 'gc-statistics',
        measureAfter: true,
        newLabel: 'new',
        newVscodePath: '/tmp/vscode-b',
        oldLabel: 'old',
        oldVscodePath: '/tmp/vscode-a',
        only: '^editor-open.ts',
        runs: 97,
        skipBuild: true,
        skipCharts: true,
      },
      '/tmp/code-oss',
    ),
  ).toEqual([
    'packages/cli/bin/test.js',
    '--run-skipped-tests-anyway',
    '--only',
    '^editor-open.ts',
    '--runs',
    '97',
    '--measure',
    'gc-statistics',
    '--vscode-path',
    '/tmp/code-oss',
    '--measure-after',
  ])
})

test('getMinifiedExecutablePath derives local minified executable path', () => {
  expect(getMinifiedExecutablePath('/root/.cache/repos/vscode')).toBe(join('/root/.cache/repos', 'VSCode-linux-x64-vscode', 'code-oss'))
  expect(getMinifiedExecutablePath('/root/.cache/repos/vscode-2')).toBe(join('/root/.cache/repos', 'VSCode-linux-x64-vscode-2', 'code-oss'))
})

test('getLabeledResultPath inserts label before json extension', () => {
  expect(getLabeledResultPath('/tmp/results/editor-open.json', 'old')).toBe('/tmp/results/editor-open.old.json')
})

test('renameResult replaces an existing labeled result', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'measure-local-vscode-comparison-'))
  const resultPath = join(dir, 'cpu-performance-counters', 'editor-open.json')
  const oldResultPath = join(dir, 'cpu-performance-counters', 'editor-open.old.json')
  await mkdir(dirname(resultPath), { recursive: true })
  await writeFile(resultPath, 'new content')
  await writeFile(oldResultPath, 'old content')

  await expect(renameResult(resultPath, 'old')).resolves.toBe(oldResultPath)
  await expect(readFile(oldResultPath, 'utf8')).resolves.toBe('new content')
})

test('getEnsureLocalVscodeBuildActions computes install and minify actions', () => {
  expect(
    getEnsureLocalVscodeBuildActions({
      hasValidNodeModulesCache: false,
      hasMinifiedExecutable: false,
      skipBuild: false,
    }),
  ).toEqual(['install', 'minify'])
  expect(
    getEnsureLocalVscodeBuildActions({
      hasValidNodeModulesCache: false,
      hasMinifiedExecutable: false,
      skipBuild: true,
    }),
  ).toEqual([])
  expect(
    getEnsureLocalVscodeBuildActions({
      hasValidNodeModulesCache: true,
      hasMinifiedExecutable: true,
      skipBuild: false,
    }),
  ).toEqual([])
})

test('hasUnstagedChanges detects unstaged and untracked changes', () => {
  expect(hasUnstagedChanges(' M src/file.ts\n')).toBe(true)
  expect(hasUnstagedChanges('?? src/new.ts\n')).toBe(true)
  expect(hasUnstagedChanges('M  src/file.ts\n')).toBe(false)
  expect(hasUnstagedChanges('')).toBe(false)
})

test('computeVscodeNodeModulesCacheKey hashes nvmrc and package locks', async () => {
  const repoPath = await createVscodeFixture()
  const first = await computeVscodeNodeModulesCacheKey(repoPath)
  await mkdir(join(repoPath, 'extensions', 'example'), { recursive: true })
  await writeFile(join(repoPath, 'extensions', 'example', 'package-lock.json'), 'nested-lock')

  await expect(computeVscodeNodeModulesCacheKey(repoPath)).resolves.not.toBe(first)
})

test('ensureLocalVscodeBuild skips commands when repo is ready', async () => {
  const repoPath = await createVscodeFixture()
  const commit = 'abcdef'
  const cacheDir = getLocalVscodeComparisonCacheDir(repoPath)
  await mkdir(cacheDir, { recursive: true })
  await writeFile(join(cacheDir, 'minified-build-commit.txt'), `${commit}\n`)
  const commands: string[] = []
  const executablePath = await ensureLocalVscodeBuild(repoPath, false, {
    hasCompleteNodeModulesCache: async () => true,
    pathExists: async () => true,
    readCommand: async (command, args) => {
      if (command === 'git' && args[0] === 'status') {
        return ''
      }
      return `${commit}\n`
    },
    runCommand: async (command, args) => {
      commands.push([command, ...args].join(' '))
    },
  })

  expect(executablePath).toBe(getMinifiedExecutablePath(repoPath))
  expect(commands).toEqual([])
})

test('ensureLocalVscodeBuild runs minify when executable is missing', async () => {
  const repoPath = await createVscodeFixture()
  const commands: string[] = []
  const sharedBuildPath = join(dirname(repoPath), 'VSCode-linux-x64')
  await mkdir(sharedBuildPath, { recursive: true })
  await writeFile(join(sharedBuildPath, 'code-oss'), '')
  const executablePath = await ensureLocalVscodeBuild(repoPath, false, {
    hasCompleteNodeModulesCache: async () => true,
    pathExists: async (path) => path === join(sharedBuildPath, 'code-oss'),
    readCommand: async (command, args) => {
      if (command === 'git' && args[0] === 'status') {
        return ''
      }
      return 'abcdef\n'
    },
    runCommand: async (command, args) => {
      commands.push([command, ...args].join(' '))
      await mkdir(sharedBuildPath, { recursive: true })
      await writeFile(join(sharedBuildPath, 'code-oss'), '')
    },
  })

  expect(executablePath).toBe(getMinifiedExecutablePath(repoPath))
  expect(commands).toEqual(['npx gulp vscode-linux-x64-min'])
  await expect(readFile(join(getLocalVscodeComparisonCacheDir(repoPath), 'minified-build-commit.txt'), 'utf8')).resolves.toBe('abcdef\n')
  await expect(readFile(getMinifiedExecutablePath(repoPath), 'utf8')).resolves.toBe('')
})

test('ensureLocalVscodeBuild skips install when node_modules cache stamp matches', async () => {
  const repoPath = await createVscodeFixture()
  const commit = 'abcdef'
  const cacheKey = await computeVscodeNodeModulesCacheKey(repoPath)
  const cacheDir = getLocalVscodeComparisonCacheDir(repoPath)
  await mkdir(cacheDir, { recursive: true })
  await writeFile(join(cacheDir, 'node_modules-cache-key.txt'), `${cacheKey}\n`)
  await writeFile(join(cacheDir, 'minified-build-commit.txt'), `${commit}\n`)
  const commands: string[] = []

  await ensureLocalVscodeBuild(repoPath, false, {
    hasCompleteNodeModulesCache: async () => {
      throw new Error('hasCompleteNodeModulesCache should not be called when stamp matches')
    },
    pathExists: async () => true,
    readCommand: async (command, args) => {
      if (command === 'git' && args[0] === 'status') {
        return ''
      }
      return `${commit}\n`
    },
    runCommand: async (command, args) => {
      commands.push([command, ...args].join(' '))
    },
  })

  expect(commands).toEqual([])
})

test('ensureLocalVscodeBuild aborts on unstaged changes', async () => {
  const repoPath = await createVscodeFixture()

  await expect(
    ensureLocalVscodeBuild(repoPath, false, {
      hasCompleteNodeModulesCache: async () => true,
      pathExists: async () => true,
      readCommand: async () => ' M src/file.ts\n',
      runCommand: async () => {},
    }),
  ).rejects.toThrow(`VS Code repository has unstaged changes: ${repoPath}`)
})
