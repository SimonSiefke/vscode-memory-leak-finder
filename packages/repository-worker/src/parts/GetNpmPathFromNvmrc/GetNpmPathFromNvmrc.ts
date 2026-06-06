import { dirname } from 'node:path'
import { homedir } from 'node:os'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as InstallNodeVersion from '../InstallNodeVersion/InstallNodeVersion.ts'
import * as Path from '../Path/Path.ts'

const getNvmDirectories = (): readonly string[] => {
  const homeDir = homedir()
  const candidates = [process.env.NVM_DIR, Path.join(homeDir, '.nvm'), Path.join(homeDir, '.config', 'nvm')]
  const { execPath } = process
  const nvmIndex = execPath.indexOf('/nvm/')
  if (nvmIndex !== -1) {
    candidates.unshift(Path.join(execPath.slice(0, nvmIndex), 'nvm'))
  }
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))]
}

const findNpmPathInNvm = async (nodeVersion: string): Promise<string | undefined> => {
  for (const nvmDirectory of getNvmDirectories()) {
    const binDirectory = Path.join(nvmDirectory, 'versions', 'node', `v${nodeVersion}`, 'bin')
    const nodePath = Path.join(binDirectory, 'node')
    const npmPath = Path.join(binDirectory, 'npm')
    if ((await FileSystemWorker.pathExists(nodePath)) && (await FileSystemWorker.pathExists(npmPath))) {
      return npmPath
    }
  }
  return undefined
}

const findNvmrcPath = async (repoPath: string): Promise<string> => {
  let currentPath = repoPath
  while (true) {
    const nvmrcPath = Path.join(currentPath, '.nvmrc')
    if (await FileSystemWorker.pathExists(nvmrcPath)) {
      return nvmrcPath
    }
    const parentPath = dirname(currentPath)
    if (parentPath === currentPath) {
      throw new Error(`.nvmrc not found in '${repoPath}' or any parent directory`)
    }
    currentPath = parentPath
  }
}

export const getNpmPathFromNvmrc = async (repoPath: string): Promise<string> => {
  const nvmrcPath = await findNvmrcPath(repoPath)
  const nvmrcContent = await FileSystemWorker.readFileContent(nvmrcPath)
  const nodeVersion = nvmrcContent.trim().replace(/^v/, '')
  const npmPath = await findNpmPathInNvm(nodeVersion)
  if (npmPath) {
    return npmPath
  }

  await InstallNodeVersion.installNodeVersion(nodeVersion)

  const installedNpmPath = await findNpmPathInNvm(nodeVersion)
  if (!installedNpmPath) {
    throw new Error(`npm not found for node version ${nodeVersion} in known nvm directories`)
  }
  return installedNpmPath
}
