import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js'
import * as Env from '../Env/Env.js'

export const getBinaryPath = async (vscodeVersion, vscodePath) => {
  if (vscodePath) {
    return vscodePath
  }
  if (Env.env.VSCODE_PATH) {
    console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(vscodeVersion)
  return path
}
