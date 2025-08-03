import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { cpSync } from 'node:fs'
import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

const VSCODE_NODE_MODULES_CACHE_DIR = '.vscode-node-modules'

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

      // Copy cached node_modules to the repo
      const targetNodeModulesPath = join(repoPath, 'node_modules')
      cpSync(cachedNodeModulesPath, targetNodeModulesPath, { recursive: true })

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

    // Check if node_modules exists in the repo
    if (!existsSync(sourceNodeModulesPath)) {
      console.log('No node_modules found to cache')
      return
    }

    // Create cache directory if it doesn't exist
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true })
    }

    // Copy node_modules to cache
    console.log(`Caching node_modules with cache key: ${cacheKey}`)
    cpSync(sourceNodeModulesPath, cachedNodeModulesPath, { recursive: true })
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
