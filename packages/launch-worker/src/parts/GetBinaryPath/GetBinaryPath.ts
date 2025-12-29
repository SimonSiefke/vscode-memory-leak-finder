import { join } from 'node:path'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as Env from '../Env/Env.ts'
import * as Root from '../Root/Root.ts'

export const getBinaryPath = async (platform: string, arch: string, vscodeVersion: string, vscodePath: string, commit: string, insidersCommit: string, updateUrl: string): Promise<string> => {
  if (vscodePath) {
    return vscodePath
  }
  if (insidersCommit && typeof insidersCommit === 'string' && insidersCommit !== '') {
    return await DownloadAndUnzipVscode.downloadAndUnzipVscode({
      arch,
      insidersCommit,
      platform,
      updateUrl,
    })
  }
  if (commit && typeof commit === 'string' && commit !== '') {
    const repoUrl = 'https://github.com/microsoft/vscode.git'
    const reposDir = join(Root.root, '.vscode-repos')
    const nodeModulesCacheDir = join(Root.root, '.vscode-node-modules-cache')
    const useNice = platform === 'linux'
    return await DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(platform, arch, commit, repoUrl, reposDir, nodeModulesCacheDir, useNice)
  }
  if (insidersCommit) {
    return await DownloadAndUnzipVscode.downloadAndUnzipVscode({
      arch,
      insidersCommit,
      platform,
      updateUrl,
    })
  }
  if (Env.env.VSCODE_PATH) {
    console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode({
    arch,
    platform,
    vscodeVersion,
  })
  return path
}
