import { VError } from '@lvce-editor/verror'
import { dirname as getDirname } from 'node:path'
import { exec } from '../Exec/Exec.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { findPackageLockFiles } from '../FindPackageLockFiles/FindPackageLockFiles.ts'
import * as GetNpmPathFromNvmrc from '../GetNpmPathFromNvmrc/GetNpmPathFromNvmrc.ts'
import { hasCompleteTopLevelNodeModules } from '../HasCompleteTopLevelNodeModules/HasCompleteTopLevelNodeModules.ts'
import * as Path from '../Path/Path.ts'

const doNpmCommand = async (cwd: string, useNice: boolean, args: readonly string[]) => {
  const npmPath = await GetNpmPathFromNvmrc.getNpmPathFromNvmrc(cwd)
  const binDirname = getDirname(npmPath)
  const oldPath = process.env.PATH
  const newPath = `${binDirname}:${oldPath}`
  if (useNice) {
    return exec('nice', ['-n', '10', npmPath, ...args], {
      cwd,
      env: {
        ...process.env,
        PATH: newPath,
      },
      stdio: 'inherit',
    })
  }
  return exec(npmPath, [...args], { cwd, env: { ...process.env, PATH: newPath }, stdio: 'inherit' })
}

const getInstallArgs = (cwd: string): readonly string[] => {
  if (cwd.endsWith('/extensions/copilot/chat-lib') || cwd.endsWith('\\extensions\\copilot\\chat-lib')) {
    return ['ci', '--ignore-scripts']
  }
  return ['ci']
}

const installDependenciesInDirectory = async (cwd: string, useNice: boolean): Promise<void> => {
  try {
    await doNpmCommand(cwd, useNice, getInstallArgs(cwd))
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
