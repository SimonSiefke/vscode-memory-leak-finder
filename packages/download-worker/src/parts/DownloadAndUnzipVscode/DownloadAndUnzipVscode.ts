import { join, resolve } from 'node:path'
import { readdir, rm } from 'node:fs/promises'
import { VError } from '@lvce-editor/verror'
import * as AdjustVscodeProductJson from '../AdjustVscodeProductJson/AdjustVscodeProductJson.ts'
import * as Env from '../Env/Env.ts'
import * as JsonFile from '../JsonFile/JsonFile.ts'
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
    // After download on Linux, remove unused files to reduce size
    if (process.platform === 'linux') {
      const installDir = resolve(path, '..')
      const appRoot = join(installDir, 'resources', 'app')
      const localesDir = join(installDir, 'locales')

      // 1) Remove locales except default en-US
      try {
        const entries = await readdir(localesDir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isFile()) {
            continue
          }
          if (entry.name.endsWith('.pak') && entry.name !== 'en-US.pak') {
            await rm(join(localesDir, entry.name), { force: true })
          }
        }
      } catch {}

      // 2) Remove bin folder
      try {
        await rm(join(installDir, 'bin'), { recursive: true, force: true })
      } catch {}

      // 3) Remove Chromium Licenses file
      try {
        await rm(join(installDir, 'LICENSES.chromium.html'), { force: true })
      } catch {}

      // 4) Remove vsce-sign artifacts if present
      const possibleVsceBases = [
        join(appRoot, 'node_modules', '@vscode'),
        join(appRoot, 'node_modules.asar.unpacked', '@vscode'),
      ]
      for (const base of possibleVsceBases) {
        try {
          const entries = await readdir(base, { withFileTypes: true })
          for (const entry of entries) {
            if (entry.isDirectory() && entry.name.startsWith('vsce-sign')) {
              await rm(join(base, entry.name), { recursive: true, force: true })
            }
          }
        } catch {}
      }
    }
    return path
  } catch (error) {
    throw new VError(error, `Failed to download vscode ${vscodeVersion}`)
  }
}
