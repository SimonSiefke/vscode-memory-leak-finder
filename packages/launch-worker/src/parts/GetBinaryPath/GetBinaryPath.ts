import { join } from 'node:path'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as Env from '../Env/Env.ts'
import * as Root from '../Root/Root.ts'

const disableVscodeNodeModulesCacheEnvVar = 'VSCODE_MEMORY_LEAK_FINDER_DISABLE_VSCODE_NODE_MODULES_CACHE'
const useStableVscodeRepoPathEnvVar = 'VSCODE_MEMORY_LEAK_FINDER_USE_STABLE_VSCODE_REPO_PATH'

export const getBinaryPath = async (
  platform: string,
  arch: string,
  vscodeVersion: string,
  vscodePath: string,
  commit: string,
  insidersCommit: string,
  updateUrl: string,
): Promise<string> => {
  if (vscodePath) {
    return vscodePath
  }
  if (insidersCommit && typeof insidersCommit === 'string' && insidersCommit !== '') {
    return await DownloadAndUnzipVscode.downloadAndUnzipVscode({
      arch,
      insidersCommit,
      platform,
      updateUrl,
      vscodeVersion: '',
    })
  }
  if (commit && typeof commit === 'string' && commit !== '') {
    const repoUrl = 'https://github.com/microsoft/vscode.git'
    const reposDir = join(Root.root, '.vscode-repos')
    const nodeModulesCacheDir =
      process.env[disableVscodeNodeModulesCacheEnvVar] === '1' ? '' : join(Root.root, '.vscode-node-modules-cache')
    const repoFolderName = process.env[useStableVscodeRepoPathEnvVar] === '1' ? 'default' : ''
    const useNice = platform === 'linux'
    return await DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(
      platform,
      arch,
      commit,
      repoUrl,
      reposDir,
      nodeModulesCacheDir,
      useNice,
      repoFolderName,
    )
  }
  if (insidersCommit) {
    return await DownloadAndUnzipVscode.downloadAndUnzipVscode({
      arch,
      insidersCommit,
      platform,
      updateUrl,
      vscodeVersion: '',
    })
  }
  if (Env.env.VSCODE_PATH) {
    console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode({
    arch,
    insidersCommit: '',
    platform,
    updateUrl: '',
    vscodeVersion,
  })
  return path
}
