import { spawn } from 'node:child_process'
import { readFile, readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const maxCapturedOutputLength = 4_000
const maxNpmInstallAttempts = 3
const npmConnectionResetError = 'npm error code ECONNRESET'
const nvmSourceCommand =
  'if [ -n "${NVM_DIR:-}" ] && [ -s "$NVM_DIR/nvm.sh" ]; then . "$NVM_DIR/nvm.sh"; elif [ -s "$HOME/.nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; elif [ -s "$HOME/.config/nvm/nvm.sh" ]; then export NVM_DIR="$HOME/.config/nvm"; . "$NVM_DIR/nvm.sh"; else echo "nvm.sh not found" >&2; exit 1; fi; '

interface NpmExecution {
  readonly command: string
  readonly env: NodeJS.ProcessEnv
}

interface PackageLock {
  readonly packages?: Record<
    string,
    {
      readonly dependencies?: Record<string, string>
      readonly devDependencies?: Record<string, string>
    }
  >
}

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const isLocalVsCodeCheckout = (binaryPath: string): boolean => {
  return binaryPath.endsWith('/scripts/code.sh') || binaryPath.endsWith('\\scripts\\code.sh')
}

const appendOutput = (existing: string, chunk: string): string => {
  const combined = `${existing}${chunk}`
  if (combined.length <= maxCapturedOutputLength) {
    return combined
  }
  return combined.slice(-maxCapturedOutputLength)
}

const formatCommandFailure = (command: string, args: readonly string[], stdout: string, stderr: string, exitCode: number): Error => {
  const details = [`Command \"${command} ${args.join(' ')}\" failed with exit code ${exitCode}.`]
  if (stdout.trim()) {
    details.push(`stdout:\n${stdout.trim()}`)
  }
  if (stderr.trim()) {
    details.push(`stderr:\n${stderr.trim()}`)
  }
  return new Error(details.join('\n\n'))
}

const getNvmDirectories = (): readonly string[] => {
  const homeDir = homedir()
  const candidates = [process.env.NVM_DIR, join(homeDir, '.nvm'), join(homeDir, '.config', 'nvm')]
  const nvmIndex = process.execPath.indexOf('/nvm/')
  if (nvmIndex !== -1) {
    candidates.unshift(join(process.execPath.slice(0, nvmIndex), 'nvm'))
  }
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))]
}

const findNvmrcPath = async (repoPath: string): Promise<string | undefined> => {
  let currentPath = repoPath
  while (true) {
    const nvmrcPath = join(currentPath, '.nvmrc')
    if (await pathExists(nvmrcPath)) {
      return nvmrcPath
    }
    const parentPath = dirname(currentPath)
    if (parentPath === currentPath) {
      return undefined
    }
    currentPath = parentPath
  }
}

const findNpmPathInNvm = async (nodeVersion: string): Promise<string | undefined> => {
  for (const nvmDirectory of getNvmDirectories()) {
    const binDirectory = join(nvmDirectory, 'versions', 'node', `v${nodeVersion}`, 'bin')
    const nodePath = join(binDirectory, 'node')
    const npmPath = join(binDirectory, 'npm')
    if ((await pathExists(nodePath)) && (await pathExists(npmPath))) {
      return npmPath
    }
  }
  return undefined
}

const runCommand = async (command: string, args: readonly string[], cwd: string, env: NodeJS.ProcessEnv): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd,
      env,
      stdio: 'pipe',
    })
    let stdout = ''
    let stderr = ''
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (data: string | Buffer) => {
      stdout = appendOutput(stdout, data.toString())
    })
    child.stderr?.setEncoding('utf8')
    child.stderr?.on('data', (data: string | Buffer) => {
      stderr = appendOutput(stderr, data.toString())
    })
    child.on('error', reject)
    child.on('close', (exitCode) => {
      if (exitCode && exitCode !== 0) {
        reject(formatCommandFailure(command, args, stdout, stderr, exitCode))
        return
      }
      resolve()
    })
  })
}

const installNodeVersion = async (nodeVersion: string, repoPath: string): Promise<void> => {
  const shellCommand = `${nvmSourceCommand}nvm install ${nodeVersion}`
  await runCommand('bash', ['-lc', shellCommand], repoPath, process.env)
}

const getNpmExecution = async (repoPath: string): Promise<NpmExecution> => {
  if (process.platform === 'win32') {
    return {
      command: npmCommand,
      env: process.env,
    }
  }

  const nvmrcPath = await findNvmrcPath(repoPath)
  if (!nvmrcPath) {
    return {
      command: npmCommand,
      env: process.env,
    }
  }

  const nodeVersion = (await readFile(nvmrcPath, 'utf8')).trim().replace(/^v/, '')
  if (process.versions.node === nodeVersion) {
    return {
      command: npmCommand,
      env: process.env,
    }
  }

  let resolvedNpmPath = await findNpmPathInNvm(nodeVersion)
  if (!resolvedNpmPath) {
    await installNodeVersion(nodeVersion, repoPath)
    resolvedNpmPath = await findNpmPathInNvm(nodeVersion)
  }

  if (!resolvedNpmPath) {
    throw new Error(`npm not found for node version ${nodeVersion}`)
  }

  const binDirectory = dirname(resolvedNpmPath)
  return {
    command: resolvedNpmPath,
    env: {
      ...process.env,
      PATH: `${binDirectory}:${process.env.PATH || ''}`,
    },
  }
}

const runNpmCommand = async (repoPath: string, args: readonly string[], npmExecution: NpmExecution): Promise<void> => {
  await runCommand(npmExecution.command, args, repoPath, npmExecution.env)
}

const isRetryableNpmInstallError = (error: unknown): boolean => {
  return String(error).includes(npmConnectionResetError)
}

const runNpmInstallWithRetry = async (repoPath: string, args: readonly string[], npmExecution: NpmExecution): Promise<void> => {
  let lastError: unknown = undefined
  for (let attempt = 1; attempt <= maxNpmInstallAttempts; attempt++) {
    try {
      await runNpmCommand(repoPath, args, npmExecution)
      return
    } catch (error) {
      lastError = error
      if (!isRetryableNpmInstallError(error) || attempt === maxNpmInstallAttempts) {
        throw error
      }
    }
  }
  throw lastError
}

const getInstallArgs = (repoPath: string): readonly string[] => {
  if (repoPath.endsWith('/extensions/copilot/chat-lib') || repoPath.endsWith('\\extensions\\copilot\\chat-lib')) {
    return ['ci', '--ignore-scripts']
  }
  return ['ci']
}

const getExpectedTopLevelPackages = (packageLockContent: string): readonly string[] => {
  const parsed = JSON.parse(packageLockContent) as PackageLock
  const rootPackage = parsed.packages?.['']
  if (!rootPackage) {
    return []
  }
  const dependencyNames = Object.keys(rootPackage.dependencies || {})
  const devDependencyNames = Object.keys(rootPackage.devDependencies || {})
  return [...new Set([...dependencyNames, ...devDependencyNames])].sort()
}

const hasCompleteTopLevelNodeModules = async (repoPath: string): Promise<boolean> => {
  const packageLockPath = join(repoPath, 'package-lock.json')
  const nodeModulesPackageLockPath = join(repoPath, 'node_modules', '.package-lock.json')
  if (!(await pathExists(packageLockPath)) || !(await pathExists(nodeModulesPackageLockPath))) {
    return false
  }
  const packageLockContent = await readFile(packageLockPath, 'utf8')
  const expectedTopLevelPackages = getExpectedTopLevelPackages(packageLockContent)
  if (expectedTopLevelPackages.length === 0) {
    return false
  }
  const packageExistence = await Promise.all(
    expectedTopLevelPackages.map((packageName) => pathExists(join(repoPath, 'node_modules', ...packageName.split('/')))),
  )
  return packageExistence.every(Boolean)
}

const findNestedPackageDirectories = async (repoPath: string): Promise<readonly string[]> => {
  const packageDirectories = new Set<string>()

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
      if (entry.isFile() && entry.name === 'package-lock.json' && currentPath !== repoPath) {
        packageDirectories.add(currentPath)
      }
    }
  }

  await visit(repoPath)
  return [...packageDirectories].sort()
}

const getPackageDirectoriesNeedingInstall = async (repoPath: string): Promise<readonly string[]> => {
  const packageDirectories = [repoPath, ...(await findNestedPackageDirectories(repoPath))]
  const directoriesNeedingInstall: string[] = []
  for (const packageDirectory of packageDirectories) {
    const packageJsonPath = join(packageDirectory, 'package.json')
    if (!(await pathExists(packageJsonPath))) {
      continue
    }
    const nodeModulesPath = join(packageDirectory, 'node_modules')
    const hasNodeModules = await pathExists(nodeModulesPath)
    if (!hasNodeModules) {
      directoriesNeedingInstall.push(packageDirectory)
      continue
    }
    if (packageDirectory !== repoPath && !(await hasCompleteTopLevelNodeModules(packageDirectory))) {
      directoriesNeedingInstall.push(packageDirectory)
    }
  }
  return directoriesNeedingInstall
}

const ensureRequiredNodeModulesInstalled = async (repoPath: string): Promise<void> => {
  const packageDirectoriesNeedingInstall = await getPackageDirectoriesNeedingInstall(repoPath)
  if (packageDirectoriesNeedingInstall.length === 0) {
    return
  }
  const npmExecution = await getNpmExecution(repoPath)
  try {
    for (const packageDirectory of packageDirectoriesNeedingInstall) {
      await runNpmInstallWithRetry(packageDirectory, getInstallArgs(packageDirectory), npmExecution)
    }
  } catch (error) {
    throw new Error(`Failed to install dependencies for local VS Code checkout at \"${repoPath}\": ${String(error)}`)
  }
}

const compileLocalVsCodeCheckout = async (repoPath: string): Promise<void> => {
  try {
    const npmExecution = await getNpmExecution(repoPath)
    await runNpmCommand(repoPath, ['run', 'compile'], npmExecution)
  } catch (error) {
    throw new Error(`Failed to compile local VS Code checkout at \"${repoPath}\": ${String(error)}`)
  }
}

const compileLocalVsCodeCopilotExtension = async (repoPath: string): Promise<void> => {
  try {
    const npmExecution = await getNpmExecution(repoPath)
    await runNpmCommand(repoPath, ['--prefix', join('extensions', 'copilot'), 'run', 'compile'], npmExecution)
  } catch (error) {
    throw new Error(`Failed to compile built-in Copilot extension for local VS Code checkout at \"${repoPath}\": ${String(error)}`)
  }
}

export const assertLocalVsCodeBuildReady = async (binaryPath: string, enableExtensions: boolean): Promise<void> => {
  if (!isLocalVsCodeCheckout(binaryPath)) {
    return
  }
  if (Math) {
    return
  }
  const repoPath = dirname(dirname(binaryPath))
  await ensureRequiredNodeModulesInstalled(repoPath)
  await compileLocalVsCodeCheckout(repoPath)
  const mainJsPath = join(repoPath, 'out', 'main.js')
  if (!(await pathExists(mainJsPath))) {
    throw new Error(
      `Local VS Code checkout at "${repoPath}" is still missing core build output after running "npm run compile". Missing "${mainJsPath}".`,
    )
  }
  if (!enableExtensions) {
    return
  }
  const copilotExtensionPath = join(repoPath, 'extensions', 'copilot')
  const copilotPackagePath = join(copilotExtensionPath, 'package.json')
  if (!(await pathExists(copilotPackagePath))) {
    return
  }
  const copilotDistPath = join(copilotExtensionPath, 'dist', 'extension.js')
  if (!(await pathExists(copilotDistPath))) {
    await compileLocalVsCodeCopilotExtension(repoPath)
  }
  if (!(await pathExists(copilotDistPath))) {
    throw new Error(
      `Local VS Code checkout at "${repoPath}" is still missing Copilot Chat build output after running "npm run compile" and "npm --prefix extensions/copilot run compile". Missing "${copilotDistPath}".`,
    )
  }
}
