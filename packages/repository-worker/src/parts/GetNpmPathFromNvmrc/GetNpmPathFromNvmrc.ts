import { homedir } from 'node:os'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import * as Path from '../Path/Path.ts'

export const getNpmPathFromNvmrc = async (repoPath: string): Promise<string> => {
  const nvmrcPath = Path.join(repoPath, '.nvmrc')
  const nvmrcContent = await FileSystemWorker.readFileContent(nvmrcPath)
  const nodeVersion = nvmrcContent.trim().replace(/^v/, '')
  const homeDir = homedir()
  // TODO make this work on macos and windows also and possibly on linux with other folder structures
  const npmPath = Path.join(homeDir, '.nvm', 'versions', 'node', `v${nodeVersion}`, 'bin', 'npm')
  return npmPath
}
