import { afterEach, expect, test } from '@jest/globals'
import { chmod, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import * as AssertLocalVsCodeBuildReady from '../src/parts/AssertLocalVsCodeBuildReady/AssertLocalVsCodeBuildReady.ts'

const tempPaths: string[] = []

const compileScript = `import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const repoPath = process.cwd()
const compileCountPath = join(repoPath, '.compile-count')

let compileCount = 0
try {
  compileCount = Number(await readFile(compileCountPath, 'utf8'))
} catch {
  compileCount = 0
}

await writeFile(compileCountPath, String(compileCount + 1))
await mkdir(join(repoPath, 'out'), { recursive: true })
await writeFile(join(repoPath, 'out', 'main.js'), '')

`

const compileCopilotScript = `import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const extensionPath = process.cwd()
const repoPath = join(extensionPath, '..', '..')
const compileCountPath = join(repoPath, '.compile-copilot-count')

let compileCount = 0
try {
  compileCount = Number(await readFile(compileCountPath, 'utf8'))
} catch {
  compileCount = 0
}

await writeFile(compileCountPath, String(compileCount + 1))

try {
  await stat(join(repoPath, '.compile-copilot'))
  await mkdir(join(extensionPath, 'dist'), { recursive: true })
  await writeFile(join(extensionPath, 'dist', 'extension.js'), '')
} catch {
}
`

afterEach(async () => {
  await Promise.all(tempPaths.splice(0).map((tempPath) => rm(tempPath, { force: true, recursive: true })))
})

const createLocalVsCodeCheckout = async ({
  withNodeModules = true,
  withCoreBuild = false,
  withCopilotPackage = false,
  withCopilotBuild = false,
}: {
  withNodeModules?: boolean
  withCoreBuild?: boolean
  withCopilotPackage?: boolean
  withCopilotBuild?: boolean
}) => {
  const repoPath = await mkdtemp(join(tmpdir(), 'vscode-checkout-'))
  tempPaths.push(repoPath)
  const binaryPath = join(repoPath, 'scripts', 'code.sh')
  await mkdir(join(repoPath, 'scripts'), { recursive: true })
  await writeFile(binaryPath, '')
  await writeFile(
    join(repoPath, 'package.json'),
    JSON.stringify({ name: 'fake-vscode', private: true, type: 'module', scripts: { compile: 'node ./scripts/compile.mjs' } }),
  )
  if (withNodeModules) {
    await mkdir(join(repoPath, 'node_modules'), { recursive: true })
  }
  await writeFile(join(repoPath, 'scripts', 'compile.mjs'), compileScript)
  await writeFile(join(repoPath, 'scripts', 'compile-copilot.mjs'), compileCopilotScript)
  if (withCoreBuild) {
    await mkdir(join(repoPath, 'out'), { recursive: true })
    await writeFile(join(repoPath, 'out', 'main.js'), '')
  }
  if (withCopilotPackage) {
    await mkdir(join(repoPath, 'extensions', 'copilot'), { recursive: true })
    await writeFile(
      join(repoPath, 'extensions', 'copilot', 'package.json'),
      JSON.stringify({
        name: 'fake-copilot',
        private: true,
        type: 'module',
        scripts: { compile: 'node ../../scripts/compile-copilot.mjs' },
      }),
    )
    await mkdir(join(repoPath, 'extensions', 'copilot', 'node_modules'), { recursive: true })
  }
  if (withCopilotBuild) {
    await writeFile(join(repoPath, '.compile-copilot'), '')
  }
  return {
    binaryPath,
    repoPath,
  }
}

const getCompileCount = async (repoPath: string): Promise<number> => {
  const value = await readFile(join(repoPath, '.compile-count'), 'utf8')
  return Number(value)
}

const getCopilotCompileCount = async (repoPath: string): Promise<number> => {
  const value = await readFile(join(repoPath, '.compile-copilot-count'), 'utf8')
  return Number(value)
}

test('assertLocalVsCodeBuildReady - ignores non local vscode paths', async () => {
  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady('/tmp/code', true)).resolves.toBeUndefined()
})

test('assertLocalVsCodeBuildReady - compiles core build output for local checkouts', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({})

  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, false)).resolves.toBeUndefined()
  await expect(getCompileCount(repoPath)).resolves.toBe(1)
})

test('assertLocalVsCodeBuildReady - recompiles even when core output already exists', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({
    withCoreBuild: true,
  })

  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, false)).resolves.toBeUndefined()
  await expect(getCompileCount(repoPath)).resolves.toBe(1)
})

test('assertLocalVsCodeBuildReady - skips copilot verification when extensions are disabled', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({
    withCoreBuild: true,
    withCopilotPackage: true,
  })

  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, false)).resolves.toBeUndefined()
  await expect(getCompileCount(repoPath)).resolves.toBe(1)
})

test('assertLocalVsCodeBuildReady - throws when copilot build output is still missing after both compile steps', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({
    withCoreBuild: true,
    withCopilotPackage: true,
  })

  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, true)).rejects.toThrow(
    `Local VS Code checkout at "${repoPath}" is still missing Copilot Chat build output after running "npm run compile" and "npm --prefix extensions/copilot run compile". Missing "${join(repoPath, 'extensions', 'copilot', 'dist', 'extension.js')}".`,
  )
  await expect(getCopilotCompileCount(repoPath)).resolves.toBe(1)
})

test('assertLocalVsCodeBuildReady - compiles copilot output explicitly when needed', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({
    withCopilotPackage: true,
    withCopilotBuild: true,
  })

  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, true)).resolves.toBeUndefined()
  await expect(getCopilotCompileCount(repoPath)).resolves.toBe(1)
})

test('assertLocalVsCodeBuildReady - reinstalls incomplete nested package dependencies before compile', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({
    withNodeModules: true,
  })
  const nestedPackagePath = join(repoPath, 'extensions', 'vscode-selfhost-test-provider')

  await mkdir(join(nestedPackagePath, 'node_modules'), { recursive: true })
  await writeFile(
    join(nestedPackagePath, 'package.json'),
    JSON.stringify({
      name: 'vscode-selfhost-test-provider',
      private: true,
    }),
  )
  await writeFile(
    join(nestedPackagePath, 'package-lock.json'),
    JSON.stringify({
      name: 'vscode-selfhost-test-provider',
      lockfileVersion: 3,
      requires: true,
      packages: {
        '': {
          name: 'vscode-selfhost-test-provider',
        },
      },
    }),
  )

  await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, false)).resolves.toBeUndefined()
  await expect(stat(join(nestedPackagePath, 'node_modules', '.package-lock.json'))).resolves.toBeDefined()
  await expect(getCompileCount(repoPath)).resolves.toBe(1)
})

test('assertLocalVsCodeBuildReady - retries npm ci when stderr includes ECONNRESET', async () => {
  const { binaryPath, repoPath } = await createLocalVsCodeCheckout({
    withNodeModules: true,
  })
  const nestedPackagePath = join(repoPath, 'extensions', 'vscode-selfhost-test-provider')
  const fakeBinPath = join(repoPath, '.fake-bin')
  const fakeNpmPath = join(fakeBinPath, 'npm')
  const originalPath = process.env.PATH || ''

  await mkdir(join(nestedPackagePath, 'node_modules'), { recursive: true })
  await writeFile(
    join(nestedPackagePath, 'package.json'),
    JSON.stringify({
      name: 'vscode-selfhost-test-provider',
      private: true,
    }),
  )
  await writeFile(
    join(nestedPackagePath, 'package-lock.json'),
    JSON.stringify({
      name: 'vscode-selfhost-test-provider',
      lockfileVersion: 3,
      requires: true,
      packages: {
        '': {
          name: 'vscode-selfhost-test-provider',
        },
      },
    }),
  )
  await mkdir(fakeBinPath, { recursive: true })
  await writeFile(
    fakeNpmPath,
    `#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const cwd = process.cwd()
const args = process.argv.slice(2)

if (args.length === 2 && args[0] === 'run' && args[1] === 'compile') {
  const compileCountPath = join(cwd, '.compile-count')
  let compileCount = 0
  try {
    compileCount = Number(await readFile(compileCountPath, 'utf8'))
  } catch {
    compileCount = 0
  }
  await writeFile(compileCountPath, String(compileCount + 1))
  await mkdir(join(cwd, 'out'), { recursive: true })
  await writeFile(join(cwd, 'out', 'main.js'), '')
  process.exit(0)
}

if (args.length >= 1 && args[0] === 'ci') {
  const attemptsPath = join(cwd, '.npm-ci-attempts')
  let attempts = 0
  try {
    attempts = Number(await readFile(attemptsPath, 'utf8'))
  } catch {
    attempts = 0
  }
  attempts += 1
  await writeFile(attemptsPath, String(attempts))
  if (attempts < 3) {
    process.stderr.write('npm error code ECONNRESET\\n')
    process.exit(1)
  }
  await mkdir(join(cwd, 'node_modules'), { recursive: true })
  await writeFile(join(cwd, 'node_modules', '.package-lock.json'), '{}')
  process.exit(0)
}

process.stderr.write('unexpected npm arguments: ' + args.join(' ') + '\\n')
process.exit(1)
`,
  )
  await chmod(fakeNpmPath, 0o755)
  process.env.PATH = `${fakeBinPath}:${originalPath}`

  try {
    await expect(AssertLocalVsCodeBuildReady.assertLocalVsCodeBuildReady(binaryPath, false)).resolves.toBeUndefined()
  } finally {
    process.env.PATH = originalPath
  }

  await expect(readFile(join(nestedPackagePath, '.npm-ci-attempts'), 'utf8')).resolves.toBe('3')
  await expect(getCompileCount(repoPath)).resolves.toBe(1)
  await expect(stat(join(nestedPackagePath, 'node_modules', '.package-lock.json'))).resolves.toBeDefined()
})
