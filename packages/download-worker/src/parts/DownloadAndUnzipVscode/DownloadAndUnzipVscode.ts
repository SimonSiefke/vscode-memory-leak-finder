import { VError } from '@lvce-editor/verror'
import { resolve } from 'node:path'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as Env from '../Env/Env.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
import * as RemoveUnusedFiles from '../RemoveUnusedFiles/RemoveUnusedFiles.ts'
import * as VscodeTestCachePath from '../VscodeTestCachePath/VscodeTestCachePath.ts'

const getProductJsonPath = (path: string): string => {
  if (process.platform === 'darwin') {
    return resolve(path, '..', '..', 'Resources', 'app', 'product.json')
  }
  return resolve(path, '..', 'resources', 'app', 'product.json')
}

/**
 * @param {string} vscodeVersion
 */
export const downloadAndUnzipVscode = async (vscodeVersion: string): Promise<string> => {
  try {
    if (Env.env.VSCODE_PATH) {
      console.warn('Warning: Using VSCODE_PATH environment variable is deprecated. Please use --vscode-path CLI flag instead.')
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
    await RemoveUnusedFiles.removeUnusedFiles(path)
    return path
  } catch (error) {
    throw new VError(error, `Failed to download vscode ${vscodeVersion}`)
  }
}
