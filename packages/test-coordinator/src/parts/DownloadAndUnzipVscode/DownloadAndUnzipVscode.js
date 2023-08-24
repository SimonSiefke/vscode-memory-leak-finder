import * as Env from '../Env/Env.js'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.js'

/**
 * @param {string} vscodeVersion
 */
export const downloadAndUnzipVscode = async (vscodeVersion) => {
  if (Env.env.VSCODE_PATH) {
    return Env.env.VSCODE_PATH
  }
  const { downloadAndUnzipVSCode } = await import('@vscode/test-electron')
  const path = await downloadAndUnzipVSCode({
    version: vscodeVersion,
    cachePath: VscodeTestCachePath.vscodeTestCachePath,
  })
  return path
}
