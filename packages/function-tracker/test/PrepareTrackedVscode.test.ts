import { beforeEach, expect, jest, test } from '@jest/globals'
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'

const mockTransformCode =
  jest.fn<
    (code: string, options: { readonly filename?: string; readonly minify?: boolean; readonly trackingMode?: string }) => Promise<string>
  >()

jest.unstable_mockModule('../src/parts/Transform/Transform.ts', () => ({
  transformCode: mockTransformCode,
}))

const { getDownloadedModifiedFolderName, getPreparedVscodePath } = await import('../src/parts/PrepareTrackedVscode/PrepareTrackedVscode.ts')

const repositoryRoot = join(import.meta.dirname, '..', '..', '..')
const trackedVscodeRoot = join(repositoryRoot, '.vscode-test', 'tracked-vscode')

beforeEach(async () => {
  jest.clearAllMocks()
  mockTransformCode.mockImplementation(async (code, options) => `/* ${options.trackingMode}:${options.filename} */\n${code}`)
  await rm(trackedVscodeRoot, { recursive: true, force: true })
})

const createDownloadedRuntime = async () => {
  const root = await mkdtemp(join(tmpdir(), 'tracked-vscode-downloaded-'))
  const runtimeRoot = join(root, 'vscode-linux-x64-1.127.0')
  const binaryPath = join(runtimeRoot, 'code-oss')
  const modulePath = join(runtimeRoot, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  const productionDependencyPath = join(runtimeRoot, 'resources', 'app', 'node_modules', 'dependency', 'index.js')
  await mkdir(dirname(modulePath), { recursive: true })
  await mkdir(dirname(productionDependencyPath), { recursive: true })
  await writeFile(binaryPath, '')
  await chmod(binaryPath, 0o755)
  await writeFile(modulePath, 'const value = {}\n')
  await writeFile(productionDependencyPath, 'module.exports = {}\n')
  return {
    binaryPath,
    modulePath,
    productionDependencyPath,
    root,
    runtimeRoot,
  }
}

test('getDownloadedModifiedFolderName appends tracking mode', () => {
  expect(getDownloadedModifiedFolderName('vscode-linux-x64-1.127.0', 'allocations')).toBe(
    'vscode-linux-x64-1.127.0-modified-tracked-allocations',
  )
})

test('getPreparedVscodePath prepares downloaded runtime and reuses cached transformed js', async () => {
  const { binaryPath, productionDependencyPath, root, runtimeRoot } = await createDownloadedRuntime()
  try {
    const first = await getPreparedVscodePath(binaryPath, 'allocations')
    const second = await getPreparedVscodePath(binaryPath, 'allocations')
    const targetRuntimeRoot = join(dirname(runtimeRoot), 'vscode-linux-x64-1.127.0-modified-tracked-allocations')
    const targetModulePath = join(targetRuntimeRoot, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')

    expect(first).toBe(join(targetRuntimeRoot, 'code-oss'))
    expect(second).toBe(first)
    expect(await readFile(targetModulePath, 'utf8')).toContain('/* allocations:')
    expect(await readFile(join(targetRuntimeRoot, 'resources', 'app', 'node_modules', 'dependency', 'index.js'), 'utf8')).toBe(
      await readFile(productionDependencyPath, 'utf8'),
    )
    expect(mockTransformCode).toHaveBeenCalledTimes(1)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('getPreparedVscodePath does not share transformed output across tracking modes', async () => {
  const { binaryPath, root } = await createDownloadedRuntime()
  try {
    const functionsPath = await getPreparedVscodePath(binaryPath, 'functions')
    const allocationsPath = await getPreparedVscodePath(binaryPath, 'allocations')

    expect(functionsPath).toContain('-modified-tracked-functions')
    expect(allocationsPath).toContain('-modified-tracked-allocations')
    expect(mockTransformCode).toHaveBeenCalledTimes(2)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('getPreparedVscodePath only transforms the workbench entry for timeout tracking', async () => {
  const { binaryPath, root, runtimeRoot } = await createDownloadedRuntime()
  const otherModulePath = join(runtimeRoot, 'resources', 'app', 'out', 'vs', 'platform', 'platform.js')
  try {
    await mkdir(dirname(otherModulePath), { recursive: true })
    await writeFile(otherModulePath, 'const platform = {}\n')
    await getPreparedVscodePath(binaryPath, 'timeouts')
    const targetRuntimeRoot = join(dirname(runtimeRoot), 'vscode-linux-x64-1.127.0-modified-tracked-timeouts')
    const targetWorkbenchPath = join(targetRuntimeRoot, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
    const targetOtherModulePath = join(targetRuntimeRoot, 'resources', 'app', 'out', 'vs', 'platform', 'platform.js')

    expect(await readFile(targetWorkbenchPath, 'utf8')).toContain('/* timeouts:')
    expect(await readFile(targetOtherModulePath, 'utf8')).toBe(await readFile(otherModulePath, 'utf8'))
    expect(mockTransformCode).toHaveBeenCalledTimes(1)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('getPreparedVscodePath copies local source checkout and preserves script path shape', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tracked-vscode-local-'))
  const sourceRoot = join(root, 'vscode')
  const binaryPath = join(sourceRoot, 'scripts', 'code.sh')
  const modulePath = join(sourceRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  try {
    await mkdir(dirname(binaryPath), { recursive: true })
    await mkdir(dirname(modulePath), { recursive: true })
    await writeFile(binaryPath, '')
    await chmod(binaryPath, 0o755)
    await writeFile(modulePath, 'const local = {}\n')

    const preparedPath = await getPreparedVscodePath(binaryPath, 'allocations')

    expect(preparedPath).toContain(join('.vscode-test', 'tracked-vscode'))
    expect(preparedPath.endsWith(join(basename(sourceRoot), 'scripts', 'code.sh'))).toBe(true)
    expect(await readFile(join(dirname(dirname(preparedPath)), 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'utf8')).toContain(
      '/* allocations:',
    )
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(trackedVscodeRoot, { recursive: true, force: true })
  }
})

test('getPreparedVscodePath copies local source checkout and adjacent build runtime', async () => {
  const root = await mkdtemp(join(tmpdir(), 'tracked-vscode-local-build-'))
  const sourceRoot = join(root, 'vscode')
  const runtimeRoot = join(root, 'VSCode-linux-x64-vscode')
  const binaryPath = join(runtimeRoot, 'code-oss')
  const sourceModulePath = join(sourceRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  const runtimeModulePath = join(runtimeRoot, 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js')
  try {
    await mkdir(dirname(sourceModulePath), { recursive: true })
    await mkdir(dirname(runtimeModulePath), { recursive: true })
    await writeFile(binaryPath, '')
    await chmod(binaryPath, 0o755)
    await writeFile(sourceModulePath, 'const source = {}\n')
    await writeFile(runtimeModulePath, 'const runtime = {}\n')

    const preparedPath = await getPreparedVscodePath(binaryPath, 'functions')

    expect(preparedPath).toContain(join('.vscode-test', 'tracked-vscode'))
    expect(preparedPath.endsWith(join('VSCode-linux-x64-vscode', 'code-oss'))).toBe(true)
    expect(
      await readFile(join(dirname(preparedPath), 'resources', 'app', 'out', 'vs', 'workbench', 'workbench.desktop.main.js'), 'utf8'),
    ).toContain('/* functions:')
    expect(
      await readFile(
        join(dirname(dirname(preparedPath)), basename(sourceRoot), 'out', 'vs', 'workbench', 'workbench.desktop.main.js'),
        'utf8',
      ),
    ).toContain('/* functions:')
  } finally {
    await rm(root, { recursive: true, force: true })
    await rm(trackedVscodeRoot, { recursive: true, force: true })
  }
})
