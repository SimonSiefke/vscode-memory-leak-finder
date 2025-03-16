import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js'
import * as Env from '../Env/Env.js'

export const getBinaryPath = async (vscodeVersion) => {
  if (Env.env.VSCODE_PATH) {
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(vscodeVersion)
  return path
}
