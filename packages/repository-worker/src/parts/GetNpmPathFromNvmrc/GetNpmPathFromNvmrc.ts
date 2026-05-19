import { homedir } from 'node:os'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as InstallNodeVersion from '../InstallNodeVersion/InstallNodeVersion.ts'
import * as Path from '../Path/Path.ts'

const getNvmDirectoryFromExecPath = (): string | undefined => {
  const normalizedExecPath = process.execPath.replaceAll('\\', '/')
  const marker = '/versions/node/'
  const markerIndex = normalizedExecPath.indexOf(marker)
  if (markerIndex === -1) {
    return undefined
  }
  return process.execPath.slice(0, markerIndex)
}

const getNvmDirectories = (): readonly string[] => {
  const homeDir = homedir()
  const candidates = [
    getNvmDirectoryFromExecPath(),
    process.env.NVM_HOME,
    process.env.NVM_DIR,
    Path.join(homeDir, '.nvm'),
    Path.join(homeDir, '.config', 'nvm'),
  ]
  if (process.platform === 'win32') {
    candidates.push(Path.join(homeDir, 'AppData', 'Roaming', 'nvm'))
  }
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))]
}

const getNodeAndNpmPaths = (nvmDirectory: string, nodeVersion: string): readonly { nodePath: string; npmPaths: readonly string[] }[] => {
  if (process.platform === 'win32') {
    const versionDirectory = Path.join(nvmDirectory, `v${nodeVersion}`)
    return [
      {
        nodePath: Path.join(versionDirectory, 'node.exe'),
        npmPaths: [Path.join(versionDirectory, 'npm.cmd'), Path.join(versionDirectory, 'npm')],
      },
    ]
  }
  const binDirectory = Path.join(nvmDirectory, 'versions', 'node', `v${nodeVersion}`, 'bin')
  return [
    {
      nodePath: Path.join(binDirectory, 'node'),
      npmPaths: [Path.join(binDirectory, 'npm')],
    },
  ]
}

const findNpmPathInNvm = async (nodeVersion: string): Promise<string | undefined> => {
  for (const nvmDirectory of getNvmDirectories()) {
    for (const { nodePath, npmPaths } of getNodeAndNpmPaths(nvmDirectory, nodeVersion)) {
      if (!(await FileSystemWorker.pathExists(nodePath))) {
        continue
      }
      for (const npmPath of npmPaths) {
        if (await FileSystemWorker.pathExists(npmPath)) {
          return npmPath
        }
      }
    }
  }
  return undefined
}

export const getNpmPathFromNvmrc = async (repoPath: string): Promise<string> => {
  const nvmrcPath = Path.join(repoPath, '.nvmrc')
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
