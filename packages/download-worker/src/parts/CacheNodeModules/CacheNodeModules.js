import * as GetCacheFileOperations from '../GetCacheFileOperations/GetCacheFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

/**
 * @param {string} repoPath
 */
export const cacheNodeModules = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const fileOperations = await GetCacheFileOperations.getCacheFileOperations(repoPath, cacheKey)
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cache node_modules: ${errorMessage}`)
  }
}