import * as Process from '../Process/Process.js'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.js'

/**
 * @param {string} vscodeVersion
 */
export const downloadAndUnzipVscode = async (vscodeVersion) => {
  if (Process.env.VSCODE_PATH) {
    return Process.env.VSCODE_PATH
  }
  const path = await downloadAndUnzipVSCode({
    version: vscodeVersion,
    cachePath: VscodeTestCachePath.vscodeTestCachePath,
  })
  return path
}
