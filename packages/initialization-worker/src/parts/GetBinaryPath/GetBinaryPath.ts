import { join } from 'node:path'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as Env from '../Env/Env.ts'
import * as Root from '../Root/Root.ts'

export const getBinaryPath = async (vscodeVersion: string, vscodePath: string, commit: string): Promise<string> => {
  if (vscodePath) {
    return vscodePath
  }
  if (commit) {
    const repoUrl = 'https://github.com/microsoft/vscode.git'
    const reposDir = join(Root.root, '.vscode-repos')
    const cacheDir = join(Root.root, '.vscode-node-modules-cache')
    const useNice = process.platform === 'linux'
    return await DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(commit, repoUrl, reposDir, cacheDir, useNice)
  }
  if (Env.env.VSCODE_PATH) {
    console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(vscodeVersion)
  return path
}
