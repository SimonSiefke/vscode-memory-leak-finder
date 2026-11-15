import { VError } from '@lvce-editor/verror'
import { dirname as getDirname } from 'node:path'
import { exec } from '../Exec/Exec.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.ts'
import * as GetNpmPathFromNvmrc from '../GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'
import { getPnpmCommandArgs } from '../GetPnpmCommandArgs/GetPnpmCommandArgs.ts'
import { hasCompleteTopLevelNodeModules } from '../HasCompleteTopLevelNodeModules/HasCompleteTopLevelNodeModules.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Path from '../Path/Path.ts'

interface ExecOptions {
  cwd: string
  env: Record<string, string | undefined>
  reject: boolean
}

interface InstallCommand {
  command: string
  args: string[]
  options: ExecOptions
}

interface ExecResult {
  exitCode: number
  stderr: string
  stdout: string
}

const maxInstallAttempts = 3
const installRetryDelay = 2000

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const getOutput = (stderr: string, stdout: string): string => {
  return stderr || stdout || 'No package manager output captured'
}

const getErrorOutput = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const maybeOutput = error as { stderr?: unknown; stdout?: unknown; message?: unknown }
    if (typeof maybeOutput.stderr === 'string' && maybeOutput.stderr) {
      return maybeOutput.stderr
    }
    if (typeof maybeOutput.stdout === 'string' && maybeOutput.stdout) {
      return maybeOutput.stdout
    }
    if (typeof maybeOutput.message === 'string' && maybeOutput.message) {
      return maybeOutput.message
    }
  }
  return String(error)
}

const getCommandText = (command: InstallCommand): string => {
  return [command.command, ...command.args].join(' ')
}

const createInstallCommand = async (cwd: string, useNice: boolean, args: readonly string[]): Promise<InstallCommand> => {
  const npmPath = await GetNpmPathFromNvmrc.getNpmPathFromNvmrc(cwd)
  const binDirname = getDirname(npmPath)
  const oldPath = process.env.PATH
  const newPath = `${binDirname}:${oldPath}`
  if (useNice) {
    return {
      command: 'nice',
      args: ['-n', '10', npmPath, ...args],
      options: {
        cwd,
        env: {
          ...process.env,
          PATH: newPath,
        },
        reject: false,
      },
    }
  }
  return {
    command: npmPath,
    args: [...args],
    options: {
      cwd,
      env: {
        ...process.env,
        PATH: newPath,
      },
      reject: false,
    },
  }
}

const throwInstallFailed = (cwd: string, command: InstallCommand, result: ExecResult, operation: string): never => {
  const commandText = getCommandText(command)
  const output = getOutput(result.stderr, result.stdout)
  throw new Error(
    `${operation} failed in directory '${cwd}' after ${maxInstallAttempts} attempts\nCommand: ${commandText}\nExit code: ${result.exitCode}\n${output}`,
  )
}

const throwInstallError = (cwd: string, command: InstallCommand, error: unknown, operation: string): never => {
  const commandText = getCommandText(command)
  const output = getErrorOutput(error)
  throw new Error(`${operation} failed in directory '${cwd}' after ${maxInstallAttempts} attempts\nCommand: ${commandText}\n${output}`)
}

const doInstallCommand = async (cwd: string, useNice: boolean, args: readonly string[], operation: string): Promise<void> => {
  const command = await createInstallCommand(cwd, useNice, args)
  if (operation === 'pnpm install') {
    // VS Code's postinstall launches additional install roots. Freeze those too.
    command.options.env.pnpm_config_frozen_lockfile = 'true'
  }
  for (let attempt = 1; attempt <= maxInstallAttempts; attempt++) {
    let result: ExecResult
    try {
      result = await exec(command.command, command.args, command.options)
    } catch (error) {
      if (attempt === maxInstallAttempts) {
        throwInstallError(cwd, command, error, operation)
      }
      Logger.log(`[repository] ${operation} failed in '${cwd}', retrying in 2 seconds... (attempt ${attempt}/${maxInstallAttempts})`)
      await sleep(installRetryDelay)
      continue
    }
    if (result.exitCode === 0) {
      return
    }
    if (attempt === maxInstallAttempts) {
      throwInstallFailed(cwd, command, result, operation)
    }
    Logger.log(`[repository] ${operation} failed in '${cwd}', retrying in 2 seconds... (attempt ${attempt}/${maxInstallAttempts})`)
    await sleep(installRetryDelay)
  }
}

const getInstallArgs = (cwd: string): readonly string[] => {
  if (cwd.endsWith('/extensions/copilot/chat-lib') || cwd.endsWith('\\extensions\\copilot\\chat-lib')) {
    return ['ci', '--ignore-scripts']
  }
  return ['ci']
}

const installDependenciesInDirectory = async (cwd: string, useNice: boolean): Promise<void> => {
  try {
    const pnpmArgs = await getPnpmCommandArgs(cwd, ['install', '--frozen-lockfile'])
    await doInstallCommand(cwd, useNice, pnpmArgs ?? getInstallArgs(cwd), pnpmArgs ? 'pnpm install' : 'npm ci')
  } catch (error) {
    throw new VError(error, `Failed to install dependencies in directory '${cwd}'`)
  }
}

const getNestedPackageDirectories = async (cwd: string): Promise<readonly string[]> => {
  const packageLockPaths = await findPackageLockFiles(cwd)
  const packageDirectories = packageLockPaths
    .map((packageLockPath) => getDirname(packageLockPath))
    .filter((packageDirectory) => packageDirectory !== cwd)
    .sort()
  return [...new Set(packageDirectories)]
}

export const ensureNestedDependencies = async (cwd: string, useNice: boolean): Promise<number> => {
  // pnpm's workspace install and VS Code's postinstall own the nested roots.
  if (await FileSystemWorker.pathExists(Path.join(cwd, 'pnpm-lock.yaml'))) {
    return 0
  }
  const packageDirectories = await getNestedPackageDirectories(cwd)
  let installedCount = 0
  for (const packageDirectory of packageDirectories) {
    const packageJsonPath = Path.join(packageDirectory, 'package.json')
    const nodeModulesPath = Path.join(packageDirectory, 'node_modules')
    const hasPackageJson = await FileSystemWorker.pathExists(packageJsonPath)
    if (!hasPackageJson) {
      continue
    }
    const hasNodeModules = await FileSystemWorker.pathExists(nodeModulesPath)
    if (hasNodeModules && (await hasCompleteTopLevelNodeModules(packageDirectory))) {
      continue
    }
    await installDependenciesInDirectory(packageDirectory, useNice)
    installedCount++
  }
  return installedCount
}

export const installDependencies = async (cwd: string, useNice: boolean): Promise<void> => {
  await installDependenciesInDirectory(cwd, useNice)
  await ensureNestedDependencies(cwd, useNice)
}
