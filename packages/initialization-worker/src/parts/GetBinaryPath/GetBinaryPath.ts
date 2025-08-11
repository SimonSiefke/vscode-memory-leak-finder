import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import * as Env from '../Env/Env.ts'

export const getBinaryPath = async (vscodeVersion: string, vscodePath: string, commit: string): Promise<string> => {
  if (vscodePath) {
    return vscodePath
  }
  if (commit) {
    return await DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit(commit)
  }
  if (Env.env.VSCODE_PATH) {
    console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(vscodeVersion)
  return path
}
