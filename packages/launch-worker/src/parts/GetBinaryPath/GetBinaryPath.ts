import { stat } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import * as BuildLocalVscodeMinified from '../BuildLocalVscodeMinified/BuildLocalVscodeMinified.ts'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as Env from '../Env/Env.ts'
import * as Root from '../Root/Root.ts'

const pathExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const isFile = async (path: string): Promise<boolean> => {
  try {
    const stats = await stat(path)
    return stats.isFile()
  } catch {
    return false
  }
}

const getLocalVscodeRepoPath = async (vscodePath: string): Promise<string> => {
  if (basename(vscodePath) === 'code.sh' && basename(dirname(vscodePath)) === 'scripts' && (await isFile(vscodePath))) {
    return dirname(dirname(vscodePath))
  }
  const codeScriptPath = join(vscodePath, 'scripts', 'code.sh')
  if (await isFile(codeScriptPath)) {
    return vscodePath
  }
  return ''
}

const resolveVscodePath = async (platform: string, arch: string, vscodePath: string, buildVscodeMinified: boolean): Promise<string> => {
  const localRepoPath = await getLocalVscodeRepoPath(vscodePath)
  if (!localRepoPath) {
    return vscodePath
  }
  if (buildVscodeMinified) {
    const useNice = platform === 'linux'
    return BuildLocalVscodeMinified.buildLocalVscodeMinified(platform, arch, localRepoPath, useNice)
  }
  const codeScriptPath = join(localRepoPath, 'scripts', 'code.sh')
  if (await pathExists(codeScriptPath)) {
    return codeScriptPath
  }
  return vscodePath
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
    return resolveVscodePath(platform, arch, vscodePath, buildVscodeMinified)
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
