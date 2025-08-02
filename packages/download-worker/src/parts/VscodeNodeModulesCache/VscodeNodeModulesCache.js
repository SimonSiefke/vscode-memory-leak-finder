import { existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs'
import { cpSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

/**
 * Recursively finds all node_modules directories in the given path
 * @param {string} rootPath - The root path to search in
 * @param {string} currentPath - The current path being searched
 * @returns {string[]} Array of paths to node_modules directories
 */
export const findAllNodeModulesDirs = (rootPath, currentPath = '') => {
  const nodeModulesDirs = []
  const fullPath = join(rootPath, currentPath)

  try {
    const entries = readdirSync(fullPath)

    for (const entry of entries) {
      const entryPath = join(fullPath, entry)
      const relativePath = join(currentPath, entry)

      // Skip .git and other system directories
      if (entry === '.git' || entry === '.vscode-repos' || entry === '.vscode-node-modules') {
        continue
      }

      const stat = statSync(entryPath)

      if (stat.isDirectory()) {
        // Check if this is a node_modules directory
        if (entry === 'node_modules') {
          nodeModulesDirs.push(relativePath)
        } else {
          // Skip if we're already inside a node_modules directory to avoid caching individual packages
          const pathParts = relativePath.split('/')
          const hasNodeModules = pathParts.some(part => part === 'node_modules')
          if (hasNodeModules) {
            continue
          }
          // Recursively search subdirectories
          nodeModulesDirs.push(...findAllNodeModulesDirs(rootPath, relativePath))
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Could not read directory ${fullPath}: ${errorMessage}`)
  }

  return nodeModulesDirs
}

/**
 * @param {string} repoPath
 */
export const setupNodeModulesFromCache = async (repoPath) => {
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
      console.log(`Using cached node_modules for cache key: ${cacheKey}`)

      // Restore the entire node_modules tree
      const targetNodeModulesPath = join(repoPath, 'node_modules')
      console.log('Restoring cached node_modules tree')
      cpSync(cachedNodeModulesTreePath, targetNodeModulesPath, { recursive: true, force: true })

      return true
    } else {
      console.log(`No cached node_modules found for cache key: ${cacheKey}`)
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
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const cacheDir = join(Root.root, VSCODE_NODE_MODULES_CACHE_DIR)
    const cachedNodeModulesPath = join(cacheDir, cacheKey)
    const sourceNodeModulesPath = join(repoPath, 'node_modules')

    // Check if top-level node_modules exists
    if (!existsSync(sourceNodeModulesPath)) {
      console.log('No top-level node_modules found to cache')
      return
    }

    // Create cache directory if it doesn't exist
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }

    // Create the cache directory for this specific cache key
    if (!existsSync(cachedNodeModulesPath)) {
      mkdirSync(cachedNodeModulesPath, { recursive: true })
    }

    // Copy the entire node_modules tree to cache
    console.log(`Caching node_modules tree with cache key: ${cacheKey}`)
    cpSync(sourceNodeModulesPath, join(cachedNodeModulesPath, 'node_modules'), { recursive: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cache node_modules: ${errorMessage}`)
  }
}

/**
 * @param {string} repoPath
 */
export const cleanupNodeModules = (repoPath) => {
  try {
    const nodeModulesPath = join(repoPath, 'node_modules')

    if (existsSync(nodeModulesPath)) {
      console.log('Cleaning up node_modules to save disk space')
      rmSync(nodeModulesPath, { recursive: true, force: true })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cleanup node_modules: ${errorMessage}`)
  }
}
