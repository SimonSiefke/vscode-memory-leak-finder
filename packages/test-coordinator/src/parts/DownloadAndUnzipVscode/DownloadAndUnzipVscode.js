import { resolve } from 'node:path'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.js'
import * as Env from '../Env/Env.js'
import * as JsonFile from '../JsonFile/JsonFile.js'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.js'

const getProductJsonPath = (path) => {
  if (process.platform === 'darwin') {
    return resolve(path, '..', '..', '..', 'Resources', 'app', 'product.json')
  }
  return resolve(path, '..', 'resources', 'app', 'product.json')
}

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
  const productPath = getProductJsonPath(path)
  const productJson = await JsonFile.readJson(productPath)
  const newProductJson = AdjustVscodeProductJson.adjustVscodeProductJson(productJson)
  await JsonFile.writeJson(productPath, newProductJson)
  return path
}
