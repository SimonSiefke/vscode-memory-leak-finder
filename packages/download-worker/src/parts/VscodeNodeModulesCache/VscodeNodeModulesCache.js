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
    if (existsSync(cachedNodeModulesPath)) {
      console.log(`Using cached node_modules for cache key: ${cacheKey}`)

      // Find all cached node_modules directories
      const cachedDirs = readdirSync(cachedNodeModulesPath)

      for (const dir of cachedDirs) {
        const cachedDirPath = join(cachedNodeModulesPath, dir)
        const targetDirPath = join(repoPath, dir)

        if (statSync(cachedDirPath).isDirectory()) {
          console.log(`Restoring cached node_modules from: ${dir}`)
          // Use force option to overwrite existing files
          cpSync(cachedDirPath, targetDirPath, { recursive: true, force: true })
        }
      }

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

    // Find all node_modules directories in the repo
    const nodeModulesDirs = findAllNodeModulesDirs(repoPath)

    if (nodeModulesDirs.length === 0) {
      console.log('No node_modules found to cache')
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

    // Copy each node_modules directory to cache
    console.log(`Caching ${nodeModulesDirs.length} node_modules directories with cache key: ${cacheKey}`)

    for (const nodeModulesDir of nodeModulesDirs) {
      const sourcePath = join(repoPath, nodeModulesDir)
      const cachePath = join(cachedNodeModulesPath, nodeModulesDir)

      // Create parent directories in cache if they don't exist
      const cacheParentDir = join(cachedNodeModulesPath, nodeModulesDir.split('/').slice(0, -1).join('/'))
      if (!existsSync(cacheParentDir)) {
        mkdirSync(cacheParentDir, { recursive: true })
      }

      console.log(`Caching node_modules from: ${nodeModulesDir}`)
      cpSync(sourcePath, cachePath, { recursive: true })
    }
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
    // Find all node_modules directories in the repo
    const nodeModulesDirs = findAllNodeModulesDirs(repoPath)

    if (nodeModulesDirs.length === 0) {
      return
    }

    console.log(`Cleaning up ${nodeModulesDirs.length} node_modules directories to save disk space`)

    for (const nodeModulesDir of nodeModulesDirs) {
      const nodeModulesPath = join(repoPath, nodeModulesDir)

      if (existsSync(nodeModulesPath)) {
        console.log(`Cleaning up: ${nodeModulesDir}`)
        rmSync(nodeModulesPath, { recursive: true, force: true })
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cleanup node_modules: ${errorMessage}`)
  }
}
