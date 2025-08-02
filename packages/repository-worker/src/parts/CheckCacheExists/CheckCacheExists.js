import { join } from 'node:path'
import { pathExists } from 'path-exists'
import { pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @param {string} commitHash
 * @returns {Promise<boolean>}
 */
export const checkCacheExists = async (commitHash) => {
  try {
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, commitHash)

    return await pathExists(cachedNodeModulesPath)
  } catch (error) {
    throw new VError(error, `Failed to check if cache exists for commit hash: ${commitHash}`)
  }
}
