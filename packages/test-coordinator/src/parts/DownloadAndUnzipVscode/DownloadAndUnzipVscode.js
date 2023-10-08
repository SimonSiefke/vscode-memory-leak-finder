import { dirname, join } from 'node:path'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.js'
import * as Env from '../Env/Env.js'
import * as JsonFile from '../JsonFile/JsonFile.js'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.js'

/**
 * @param {string} vscodeVersion
 */
export const downloadAndUnzipVscode = async (vscodeVersion) => {
  console.log({ vscodeVersion })
  if (Env.env.VSCODE_PATH) {
    return Env.env.VSCODE_PATH
  }
  const { downloadAndUnzipVSCode } = await import('@vscode/test-electron')
  const path = await downloadAndUnzipVSCode({
    version: vscodeVersion,
    cachePath: VscodeTestCachePath.vscodeTestCachePath,
  })
  const folderPath = dirname(path)
  const productPath = join(folderPath, 'resources', 'app', 'product.json')
  const productJson = await JsonFile.readJson(productPath)
  const newProductJson = AdjustVscodeProductJson.adjustVscodeProductJson(productJson)
  await JsonFile.writeJson(productPath, newProductJson)
  return path
}
