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
export const getCacheFileOperations = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)
    const sourceNodeModulesPath = join(repoPath, 'node_modules')

    // Check if top-level node_modules exists
    if (!existsSync(sourceNodeModulesPath)) {
      console.log('No top-level node_modules found to cache')
      return []
    }

    // Create cache directory if it doesn't exist
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }

    // Create the cache directory for this specific cache key
    if (!existsSync(cachedNodeModulesPath)) {
      mkdirSync(cachedNodeModulesPath, { recursive: true })
    }

    console.log(`Preparing to cache node_modules tree with cache key: ${cacheKey}`)

    return [
      {
        type: 'copy',
        from: sourceNodeModulesPath,
        to: join(cachedNodeModulesPath, 'node_modules'),
      },
    ]
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get cache file operations: ${errorMessage}`)
    return []
  }
}