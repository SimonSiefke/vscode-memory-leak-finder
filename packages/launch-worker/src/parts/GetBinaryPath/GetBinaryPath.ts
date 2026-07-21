import { join } from 'node:path'
import { stat } from 'node:fs/promises'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as Env from '../Env/Env.ts'
import * as Root from '../Root/Root.ts'

const getWorkspaceVscodeBinaryPath = async (workspacePath: string, platform: string): Promise<string> => {
  const candidateBinaryPaths = [
    join(workspacePath, '.build', 'electron', platform === 'darwin' ? 'Electron.app' : 'code-oss'),
    join(workspacePath, '.build', 'electron', 'code-oss'),
    join(workspacePath, '.build', 'electron', platform === 'win32' ? 'code-oss.exe' : 'code-oss'),
    join(workspacePath, 'code-oss'),
  ]
  for (const candidatePath of candidateBinaryPaths) {
    try {
      const statResult = await stat(candidatePath)
      if (statResult.isFile()) {
        return candidatePath
      }
      if (statResult.isDirectory() && candidatePath.endsWith('Electron.app')) {
        return candidatePath
      }
    } catch {
      // continue
    }
  }
  return workspacePath
}

export const getBinaryPath = async (
  platform: string,
  arch: string,
  vscodeVersion: string,
  vscodePath: string,
  commit: string,
  insidersCommit: string,
  updateUrl: string,
  buildVscodeMinified: boolean,
): Promise<string> => {
  if (vscodePath) {
    try {
      const statResult = await stat(vscodePath)
      if (statResult.isDirectory()) {
        return await getWorkspaceVscodeBinaryPath(vscodePath, platform)
      }
      return vscodePath
    } catch {
      return vscodePath
    }
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
    const nodeModulesCacheDir = join(Root.root, '.vscode-node-modules-cache')
    const useNice = platform === 'linux'
    return await DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(
      platform,
      arch,
      commit,
      repoUrl,
      reposDir,
      nodeModulesCacheDir,
      useNice,
      buildVscodeMinified,
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
