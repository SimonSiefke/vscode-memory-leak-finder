import { join } from 'node:path'
import { existsSync, mkdirSync, cpSync, rmSync } from 'node:fs'
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

/**
 * @param {string} repoPath
 * @returns {FileOperation[]}
 */
export const getCleanupFileOperations = (repoPath) => {
  try {
    const nodeModulesPath = join(repoPath, 'node_modules')

    if (existsSync(nodeModulesPath)) {
      console.log('Preparing to cleanup node_modules to save disk space')

      return [
        {
          type: 'remove',
          from: nodeModulesPath,
          to: '', // Not used for remove operations
        },
      ]
    }

    return []
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to get cleanup file operations: ${errorMessage}`)
    return []
  }
}

/**
 * @param {FileOperation[]} fileOperations
 */
export const applyFileOperations = async (fileOperations) => {
  if (fileOperations.length === 0) {
    return
  }

  console.log(`Applying ${fileOperations.length} file operation(s) in parallel`)

  const operations = fileOperations.map(async (operation) => {
    try {
      if (operation.type === 'copy') {
        cpSync(operation.from, operation.to, { recursive: true, force: true })
        console.log(`Copied: ${operation.from} -> ${operation.to}`)
      } else if (operation.type === 'remove') {
        rmSync(operation.from, { recursive: true, force: true })
        console.log(`Removed: ${operation.from}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Failed to apply file operation ${operation.type}: ${errorMessage}`)
      throw error
    }
  })

  await Promise.all(operations)
}

/**
 * @param {string} repoPath
 */
export const setupNodeModulesFromCache = async (repoPath) => {
  try {
    const fileOperations = await getRestoreFileOperations(repoPath)

    if (fileOperations.length > 0) {
      await applyFileOperations(fileOperations)
      return true
    } else {
      return false
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to setup node_modules from cache: ${errorMessage}`)
    return false
  }
}

/**
 * @param {string} repoPath
 */
export const cacheNodeModules = async (repoPath) => {
  try {
    const fileOperations = await getCacheFileOperations(repoPath)
    await applyFileOperations(fileOperations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cache node_modules: ${errorMessage}`)
  }
}

/**
 * @param {string} repoPath
 */
export const cleanupNodeModules = async (repoPath) => {
  try {
    const fileOperations = getCleanupFileOperations(repoPath)
    await applyFileOperations(fileOperations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cleanup node_modules: ${errorMessage}`)
  }
}
