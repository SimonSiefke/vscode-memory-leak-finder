import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js'
import * as Env from '../Env/Env.js'
import * as VscodeVersion from '../VsCodeVersion/VsCodeVersion.js'

export const getBinaryPath = async () => {
  if (Env.env.VSCODE_PATH) {
    return Env.env.VSCODE_PATH
  }
  const path = await DownloadAndUnzipVscode.downloadAndUnzipVscode(VscodeVersion.vscodeVersion)
  return path
}
