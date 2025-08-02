import * as GetRestoreFileOperations from '../GetRestoreFileOperations/GetRestoreFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'
import * as ComputeVscodeNodeModulesCacheKey from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.js'

/**
 * @param {string} repoPath
 */
export const setupNodeModulesFromCache = async (repoPath) => {
  try {
    const cacheKey = await ComputeVscodeNodeModulesCacheKey.computeVscodeNodeModulesCacheKey(repoPath)
    const fileOperations = await GetRestoreFileOperations.getRestoreFileOperations(repoPath, cacheKey)

    if (fileOperations.length > 0) {
      await ApplyFileOperations.applyFileOperations(fileOperations)
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