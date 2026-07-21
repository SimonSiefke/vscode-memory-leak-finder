import { createHash } from 'node:crypto'
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawn } from 'node:child_process'
import { hasCompleteNodeModulesCache, hasCompleteNodeModulesInDirectory } from './checkVscodeNodeModulesCache.ts'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const defaultOldVscodePath = '/root/.cache/repos/vscode-2'
const defaultNewVscodePath = '/root/.cache/repos/vscode'
const platform = 'linux'
const arch = 'x64'

export interface MeasureLocalVscodeComparisonOptions {
  readonly oldVscodePath: string
  readonly newVscodePath: string
  readonly oldLabel: string
  readonly newLabel: string
  readonly only: string
  readonly measure: string
  readonly measureAfter: boolean
  readonly measureNode: boolean
  readonly runs: number
  readonly startupRuns: number
  readonly proxyCaptureRuns: number
  readonly display: string
  readonly extraTestArgs: readonly string[]
  readonly skipBuild: boolean
  readonly skipCharts: boolean
}

const isKnownFlagWithValue = (arg: string): boolean => {
  return ['--display', '--measure', '--new-label', '--new-vscode-path', '--old-label', '--old-vscode-path', '--only', '--runs', '--startup-runs', '--vscode-path', '--proxy-capture-runs'].includes(arg)
}

const isKnownFlagWithoutValue = (arg: string): boolean => {
  return ['--measure-after', '--measure-node', '--skip-build', '--skip-charts'].includes(arg)
}

const isProxyPreparationEnabled = (extraTestArgs: readonly string[]): boolean => {
  return extraTestArgs.includes('--enable-proxy') && extraTestArgs.includes('--use-proxy-mock')
}

const getExtraTestArgs = (argv: readonly string[]): readonly string[] => {
  const extraTestArgs: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      continue
    }
    if (isKnownFlagWithValue(arg)) {
      i += 1
      continue
    }
    if (isKnownFlagWithoutValue(arg)) {
      continue
    }
    extraTestArgs.push(arg)
    const nextArg = argv[i + 1]
    if (nextArg && !nextArg.startsWith('--')) {
      extraTestArgs.push(nextArg)
      i += 1
    }
  }
  return extraTestArgs
}

interface RunCommandOptions {
  readonly cwd: string
  readonly env?: NodeJS.ProcessEnv
}

interface RunCommand {
  (command: string, args: readonly string[], options: RunCommandOptions): Promise<void>
}

interface ReadCommand {
  (command: string, args: readonly string[], options: RunCommandOptions): Promise<string>
}

interface EnsureLocalVscodeBuildDependencies {
  readonly hasCompleteNodeModulesCache: (repoPath: string) => Promise<boolean>
  readonly pathExists: (path: string) => Promise<boolean>
  readonly readCommand: ReadCommand
  readonly runCommand: RunCommand
}

export const parseArgv = (argv: readonly string[]): MeasureLocalVscodeComparisonOptions => {
  const getString = (name: string, defaultValue: string): string => {
    const index = argv.lastIndexOf(name)
    if (index === -1) {
      return defaultValue
    }
    const value = argv[index + 1]
    return typeof value === 'string' ? value : defaultValue
  }

  const getNumber = (name: string, defaultValue: number): number => {
    const value = Number.parseInt(getString(name, String(defaultValue)), 10)
    return Number.isFinite(value) && value > 0 ? value : defaultValue
  }

  return {
    display: getString('--display', ':1'),
    measure: getString('--measure', 'cpu-performance-counters'),
    measureAfter: argv.includes('--measure-after'),
    measureNode: argv.includes('--measure-node'),
    newLabel: getString('--new-label', 'new'),
    newVscodePath: getString('--new-vscode-path', defaultNewVscodePath),
    oldLabel: getString('--old-label', 'old'),
    oldVscodePath: getString('--old-vscode-path', defaultOldVscodePath),
    only: getString('--only', '^editor-open.ts'),
    runs: getNumber('--runs', 1),
    proxyCaptureRuns: getNumber('--proxy-capture-runs', 3),
    startupRuns: getNumber('--startup-runs', 1),
    skipBuild: argv.includes('--skip-build'),
    skipCharts: argv.includes('--skip-charts'),
    extraTestArgs: getExtraTestArgs(argv),
  }
}

const getMeasureCommandBaseArgs = (options: MeasureLocalVscodeComparisonOptions, vscodeExecutablePath: string): readonly string[] => {
  return [
    'packages/cli/bin/test.js',
    '--run-skipped-tests-anyway',
    '--only',
    options.only,
    '--runs',
    String(options.runs),
    '--startup-runs',
    String(options.startupRuns),
    '--vscode-path',
    vscodeExecutablePath,
  ]
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

export const getMinifiedExecutablePath = (vscodePath: string): string => {
  return join(dirname(vscodePath), `VSCode-${platform}-${arch}-${basename(vscodePath)}`, 'code-oss')
}

const getSharedMinifiedExecutablePath = (vscodePath: string): string => {
  return join(dirname(vscodePath), `VSCode-${platform}-${arch}`, 'code-oss')
}

export const getResultTestName = (filter: string): string => {
  const withoutAnchors = filter.replace(/^\^/, '').replace(/\$$/, '')
  const base = basename(withoutAnchors)
  if (base.endsWith('.ts') || base.endsWith('.js')) {
    return base.slice(0, -3)
  }
  return base.replaceAll('.', '-')
}

export const getResultPath = (measure: string, filter: string): string => {
  return join(repositoryRoot, '.vscode-memory-leak-finder-results', measure, `${getResultTestName(filter)}.json`)
}

export const getLabeledResultPath = (resultPath: string, label: string): string => {
  const extension = '.json'
  if (!resultPath.endsWith(extension)) {
    return `${resultPath}.${label}`
  }
  return `${resultPath.slice(0, -extension.length)}.${label}${extension}`
}

const runCommand: RunCommand = async (command, args, options) => {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'inherit',
    })
    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }
      rejectPromise(new Error(`Command failed with exit code ${code}: ${[command, ...args].join(' ')}`))
    })
  })
}

const readCommand: ReadCommand = async (command, args, options) => {
  return new Promise<string>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise(stdout)
        return
      }
      rejectPromise(new Error(`Command failed with exit code ${code}: ${[command, ...args].join(' ')}\n${stderr}`))
    })
  })
}

const getNvmDirectories = (): readonly string[] => {
  const candidates = [process.env.NVM_DIR, join(homedir(), '.nvm'), join(homedir(), '.config', 'nvm')]
  const nvmIndex = process.execPath.indexOf('/nvm/')
  if (nvmIndex !== -1) {
    candidates.unshift(join(process.execPath.slice(0, nvmIndex), 'nvm'))
  }
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))]
}

const findNvmrcPath = async (repoPath: string): Promise<string> => {
  let currentPath = repoPath
  while (true) {
    const nvmrcPath = join(currentPath, '.nvmrc')
    if (await pathExists(nvmrcPath)) {
      return nvmrcPath
    }
    const parentPath = dirname(currentPath)
    if (parentPath === currentPath) {
      return ''
    }
    currentPath = parentPath
  }
}

const findNodeBinPath = async (repoPath: string, executableName: string): Promise<string> => {
  const nvmrcPath = await findNvmrcPath(repoPath)
  if (!nvmrcPath) {
    return executableName
  }
  const nodeVersion = (await readFile(nvmrcPath, 'utf8')).trim().replace(/^v/, '')
  for (const nvmDirectory of getNvmDirectories()) {
    const executablePath = join(nvmDirectory, 'versions', 'node', `v${nodeVersion}`, 'bin', executableName)
    if (await pathExists(executablePath)) {
      return executablePath
    }
  }
  return executableName
}

const getCommandEnv = (executablePath: string): NodeJS.ProcessEnv => {
  if (!executablePath.includes('/')) {
    return process.env
  }
  return {
    ...process.env,
    PATH: `${dirname(executablePath)}:${process.env.PATH || ''}`,
  }
}

const findPackageLockFiles = async (repoPath: string): Promise<readonly string[]> => {
  const packageLockFiles = new Set<string>()

  const visit = async (currentPath: string): Promise<void> => {
    const entries = (await readdir(currentPath, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue
      }
      const entryPath = join(currentPath, entry.name)
      if (entry.isDirectory()) {
        await visit(entryPath)
        continue
      }
      if (entry.isFile() && entry.name === 'package-lock.json') {
        packageLockFiles.add(entryPath)
      }
    }
  }

  await visit(repoPath)
  return [...packageLockFiles].sort()
}

const findPackageDirectories = async (repoPath: string): Promise<readonly string[]> => {
  const packageLockFiles = await findPackageLockFiles(repoPath)
  const packageDirectories = new Set(packageLockFiles.map(dirname))
  return [...packageDirectories].sort((a, b) => {
    if (a === repoPath) {
      return -1
    }
    if (b === repoPath) {
      return 1
    }
    return a.localeCompare(b)
  })
}

export const computeVscodeNodeModulesCacheKey = async (repoPath: string): Promise<string> => {
  const nvmrcPath = join(repoPath, '.nvmrc')
  const packageLockFiles = await findPackageLockFiles(repoPath)
  const contents = await Promise.all([readFile(nvmrcPath, 'utf8'), ...packageLockFiles.map((filePath) => readFile(filePath, 'utf8'))])
  const hash = createHash('sha1')
  for (const content of [process.platform, process.arch, ...contents]) {
    hash.update(content)
  }
  return hash.digest('hex')
}

const readStamp = async (path: string): Promise<string> => {
  try {
    return (await readFile(path, 'utf8')).trim()
  } catch {
    return ''
  }
}

const writeStamp = async (path: string, content: string): Promise<void> => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${content}\n`)
}

const getPathHash = (path: string): string => {
  return createHash('sha1').update(resolve(path)).digest('hex').slice(0, 12)
}

export const getLocalVscodeComparisonCacheDir = (repoPath: string): string => {
  return join(repositoryRoot, '.vscode-test', 'cache-keys', 'local-vscode-comparison', `${basename(repoPath)}-${getPathHash(repoPath)}`)
}

const getNodeModulesCacheStampPath = (repoPath: string): string => {
  return join(getLocalVscodeComparisonCacheDir(repoPath), 'node_modules-cache-key.txt')
}

const getBuildCacheStampPath = (repoPath: string): string => {
  return join(getLocalVscodeComparisonCacheDir(repoPath), 'minified-build-commit.txt')
}

const moveSharedBuildToCheckoutBuild = async (vscodePath: string): Promise<void> => {
  const sharedExecutablePath = getSharedMinifiedExecutablePath(vscodePath)
  const checkoutExecutablePath = getMinifiedExecutablePath(vscodePath)
  const sharedBuildPath = dirname(sharedExecutablePath)
  const checkoutBuildPath = dirname(checkoutExecutablePath)
  if (sharedBuildPath === checkoutBuildPath) {
    return
  }
  await rm(checkoutBuildPath, { force: true, recursive: true })
  await mkdir(dirname(checkoutBuildPath), { recursive: true })
  await rename(sharedBuildPath, checkoutBuildPath)
}

const installDependencies = async (repoPath: string, run: RunCommand): Promise<void> => {
  const npmPath = await findNodeBinPath(repoPath, 'npm')
  const env = getCommandEnv(npmPath)
  const packageDirectories = await findPackageDirectories(repoPath)
  for (const packageDirectory of packageDirectories) {
    const packageJsonPath = join(packageDirectory, 'package.json')
    if (!(await pathExists(packageJsonPath))) {
      continue
    }
    if (await hasCompleteNodeModulesInDirectory(packageDirectory)) {
      continue
    }
    const args = packageDirectory.endsWith('/extensions/copilot/chat-lib') ? ['ci', '--ignore-scripts'] : ['ci']
    await run(npmPath, args, { cwd: packageDirectory, env })
  }
}

export const getEnsureLocalVscodeBuildActions = ({
  hasValidNodeModulesCache,
  hasMinifiedExecutable,
  skipBuild,
}: {
  readonly hasValidNodeModulesCache: boolean
  readonly hasMinifiedExecutable: boolean
  readonly skipBuild: boolean
}): readonly string[] => {
  if (skipBuild) {
    return []
  }
  const actions: string[] = []
  if (!hasValidNodeModulesCache) {
    actions.push('install')
  }
  if (!hasMinifiedExecutable) {
    actions.push('minify')
  }
  return actions
}

export const hasUnstagedChanges = (statusOutput: string): boolean => {
  const lines = statusOutput.split('\n').filter(Boolean)
  return lines.some((line) => line.startsWith('??') || line[1] !== ' ')
}

const assertNoUnstagedChanges = async (repoPath: string, read: ReadCommand): Promise<void> => {
  const status = await read('git', ['status', '--porcelain'], {
    cwd: repoPath,
    env: process.env,
  })
  if (hasUnstagedChanges(status)) {
    throw new Error(`VS Code repository has unstaged changes: ${repoPath}`)
  }
}

const getGitCommit = async (repoPath: string, read: ReadCommand): Promise<string> => {
  return (
    await read('git', ['rev-parse', 'HEAD'], {
      cwd: repoPath,
      env: process.env,
    })
  ).trim()
}

const hasValidNodeModulesCache = async (
  vscodePath: string,
  cacheKey: string,
  hasCompleteCache: (repoPath: string) => Promise<boolean>,
): Promise<boolean> => {
  const stampPath = getNodeModulesCacheStampPath(vscodePath)
  if ((await readStamp(stampPath)) === cacheKey) {
    return true
  }
  if (await hasCompleteCache(vscodePath)) {
    await writeStamp(stampPath, cacheKey)
    return true
  }
  return false
}

export const ensureLocalVscodeBuild = async (
  vscodePath: string,
  skipBuild: boolean,
  dependencies: EnsureLocalVscodeBuildDependencies = {
    hasCompleteNodeModulesCache,
    pathExists,
    readCommand,
    runCommand,
  },
): Promise<string> => {
  await assertNoUnstagedChanges(vscodePath, dependencies.readCommand)
  const executablePath = getMinifiedExecutablePath(vscodePath)
  const sharedExecutablePath = getSharedMinifiedExecutablePath(vscodePath)
  const nodeModulesCacheKey = await computeVscodeNodeModulesCacheKey(vscodePath)
  const hasNodeModulesCache = await hasValidNodeModulesCache(vscodePath, nodeModulesCacheKey, dependencies.hasCompleteNodeModulesCache)
  const currentCommit = await getGitCommit(vscodePath, dependencies.readCommand)
  const hasMinifiedExecutable =
    (await dependencies.pathExists(executablePath)) && (await readStamp(getBuildCacheStampPath(vscodePath))) === currentCommit
  const actions = getEnsureLocalVscodeBuildActions({
    hasValidNodeModulesCache: hasNodeModulesCache,
    hasMinifiedExecutable,
    skipBuild,
  })
  if (actions.includes('install')) {
    await installDependencies(vscodePath, dependencies.runCommand)
    await writeStamp(getNodeModulesCacheStampPath(vscodePath), nodeModulesCacheKey)
  }
  if (actions.includes('minify')) {
    const npxPath = await findNodeBinPath(vscodePath, 'npx')
    await rm(dirname(sharedExecutablePath), { force: true, recursive: true })
    try {
      await dependencies.runCommand(npxPath, ['gulp', `vscode-${platform}-${arch}-min`], {
        cwd: vscodePath,
        env: getCommandEnv(npxPath),
      })
    } catch (error) {
      if (!(await dependencies.pathExists(sharedExecutablePath))) {
        throw error
      }
      console.warn(`Warning: minified VS Code build command failed, but executable exists at ${sharedExecutablePath}. Continuing.`)
    }
    await moveSharedBuildToCheckoutBuild(vscodePath)
    await writeStamp(getBuildCacheStampPath(vscodePath), currentCommit)
  }
  return executablePath
}

export const getMeasureCommandArgs = (options: MeasureLocalVscodeComparisonOptions, vscodeExecutablePath: string): readonly string[] => {
  const measureAfterArgs = options.measureAfter ? ['--measure-after'] : []
  const measureNodeArgs = options.measureNode ? ['--measure-node'] : []
  return [
    ...getMeasureCommandBaseArgs(options, vscodeExecutablePath),
    '--measure',
    options.measure,
    ...measureNodeArgs,
    ...measureAfterArgs,
    ...options.extraTestArgs,
  ]
}

const getProxyCaptureCommandArgs = (options: MeasureLocalVscodeComparisonOptions, vscodeExecutablePath: string): readonly string[] => {
  const noUseProxyMockArgs = options.extraTestArgs.filter((arg) => arg !== '--use-proxy-mock' && arg !== '--convert-requests-to-mocks')
  return [
    'packages/cli/bin/test.js',
    '--run-skipped-tests-anyway',
    '--only',
    options.only,
    '--runs',
    String(options.proxyCaptureRuns),
    '--startup-runs',
    String(options.startupRuns),
    '--vscode-path',
    vscodeExecutablePath,
    ...noUseProxyMockArgs,
  ]
}

const runMeasure = async (options: MeasureLocalVscodeComparisonOptions, vscodeExecutablePath: string): Promise<void> => {
  await runCommand(process.execPath, getMeasureCommandArgs(options, vscodeExecutablePath), {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DISPLAY: options.display,
    },
  })
}

const prepareProxyMocksIfNeeded = async (options: MeasureLocalVscodeComparisonOptions, vscodeExecutablePath: string): Promise<void> => {
  if (!isProxyPreparationEnabled(options.extraTestArgs)) {
    return
  }
  await runCommand(process.execPath, getProxyCaptureCommandArgs(options, vscodeExecutablePath), {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DISPLAY: options.display,
    },
  })
  await runCommand(process.execPath, ['packages/cli/bin/test.js', '--convert-requests-to-mocks', '--vscode-path', vscodeExecutablePath], {
    cwd: repositoryRoot,
    env: {
      ...process.env,
      DISPLAY: options.display,
    },
  })
}

export const renameResult = async (resultPath: string, label: string): Promise<string> => {
  const labeledResultPath = getLabeledResultPath(resultPath, label)
  await mkdir(dirname(labeledResultPath), { recursive: true })
  await rm(labeledResultPath, { force: true })
  await rename(resultPath, labeledResultPath)
  return labeledResultPath
}

export const measureLocalVscodeComparison = async (options: MeasureLocalVscodeComparisonOptions): Promise<void> => {
  const oldExecutablePath = await ensureLocalVscodeBuild(options.oldVscodePath, options.skipBuild)
  const resultPath = getResultPath(options.measure, options.only)
  await prepareProxyMocksIfNeeded(options, oldExecutablePath)
  await runMeasure(options, oldExecutablePath)
  await renameResult(resultPath, options.oldLabel)

  const newExecutablePath = await ensureLocalVscodeBuild(options.newVscodePath, options.skipBuild)
  await prepareProxyMocksIfNeeded(options, newExecutablePath)
  await runMeasure(options, newExecutablePath)
  await renameResult(resultPath, options.newLabel)

  if (!options.skipCharts) {
    await runCommand('npm', ['run', 'build-charts'], {
      cwd: repositoryRoot,
      env: process.env,
    })
  }
}

const main = async (): Promise<void> => {
  try {
    await measureLocalVscodeComparison(parseArgv(process.argv.slice(2)))
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main()
}
