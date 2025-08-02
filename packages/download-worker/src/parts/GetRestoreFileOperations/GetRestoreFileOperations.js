import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import * as Root from '../Root/Root.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @param {string} repoPath
 * @returns {Promise<FileOperation[]>}
 */
export const getRestoreFileOperations = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)

    // Create cache directory if it doesn't exist
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }

    // Check if cached node_modules exists
    const cachedNodeModulesTreePath = join(cachedNodeModulesPath, 'node_modules')
    if (existsSync(cachedNodeModulesTreePath)) {
      console.log(`Found cached node_modules for cache key: ${cacheKey}`)

      return [
        {
          type: 'copy',
          from: cachedNodeModulesTreePath,
          to: join(repoPath, 'node_modules'),
        },
      ]
    } else {
      console.log(`No cached node_modules found for cache key: ${cacheKey}`)
      return []
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get restore file operations: ${errorMessage}`)
    return []
  }
}
