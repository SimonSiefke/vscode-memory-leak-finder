import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { glob } from 'node:fs/promises'
import * as Root from '../Root/Root.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove'} type
 * @property {string} from
 * @property {string} to
 */

/**
 * @param {string} repoPath
 * @param {string} cacheKey
 * @returns {Promise<FileOperation[]>}
 */
export const getCacheFileOperations = async (repoPath, cacheKey) => {
  try {
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)

    // Create cache directory if it doesn't exist
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }

    // Create the cache directory for this specific cache key
    if (!existsSync(cachedNodeModulesPath)) {
      mkdirSync(cachedNodeModulesPath, { recursive: true })
    }

    console.log(`Preparing to cache node_modules tree with cache key: ${cacheKey}`)

    const fileOperations = []

    // Find all node_modules directories in the repository using glob
    const nodeModulesPaths = []
    for await (const path of glob('**/node_modules', { cwd: repoPath })) {
      // Skip nested node_modules and .git directories
      if (!path.includes('node_modules/node_modules') && !path.includes('.git')) {
        nodeModulesPaths.push(path)
      }
    }

    // Convert relative paths to absolute paths
    const absoluteNodeModulesPaths = nodeModulesPaths.map(path => join(repoPath, path))

    for (const nodeModulesPath of absoluteNodeModulesPaths) {
      if (existsSync(nodeModulesPath)) {
        // Calculate relative path from repo root to maintain directory structure
        const relativePath = nodeModulesPath.replace(repoPath, '').replace(/^\/+/, '')
        const cacheTargetPath = join(cachedNodeModulesPath, relativePath)

        // Create parent directory if it doesn't exist
        const parentDir = join(cacheTargetPath, '..')
        if (!existsSync(parentDir)) {
          mkdirSync(parentDir, { recursive: true })
        }

        fileOperations.push({
          type: 'copy',
          from: nodeModulesPath,
          to: cacheTargetPath,
        })
      }
    }

    return fileOperations
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get cache file operations: ${errorMessage}`)
    return []
  }
}
