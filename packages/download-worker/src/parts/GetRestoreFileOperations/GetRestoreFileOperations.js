import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { glob } from 'node:fs/promises'
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

    // Check if cached node_modules exists
    if (!existsSync(cachedNodeModulesPath)) {
      console.log(`No cached node_modules found for cache key: ${cacheKey}`)
      return []
    }

    console.log(`Found cached node_modules for cache key: ${cacheKey}`)

    const fileOperations = []

    // Find all cached node_modules directories using glob
    const cachedNodeModulesPaths = []
    for await (const path of glob('**/node_modules', { cwd: cachedNodeModulesPath })) {
      // Skip nested node_modules
      if (!path.includes('node_modules/node_modules')) {
        cachedNodeModulesPaths.push(path)
      }
    }

    // Convert relative paths to absolute paths
    const absoluteCachedNodeModulesPaths = cachedNodeModulesPaths.map(path => join(cachedNodeModulesPath, path))

    for (const cachedNodeModulesPath of absoluteCachedNodeModulesPaths) {
      if (existsSync(cachedNodeModulesPath)) {
        // Calculate the target path in the repo by removing the cache prefix
        const relativePath = cachedNodeModulesPath.replace(join(cacheDir, cacheKey), '').replace(/^\/+/, '')
        const targetPath = join(repoPath, relativePath)

        // Create parent directory if it doesn't exist
        const parentDir = join(targetPath, '..')
        if (!existsSync(parentDir)) {
          mkdirSync(parentDir, { recursive: true })
        }

        fileOperations.push({
          type: 'copy',
          from: cachedNodeModulesPath,
          to: targetPath,
        })
      }
    }

    return fileOperations
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get restore file operations: ${errorMessage}`)
    return []
  }
}
