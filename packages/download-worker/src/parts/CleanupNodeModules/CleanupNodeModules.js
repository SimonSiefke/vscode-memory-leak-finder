import * as GetCleanupFileOperations from '../GetCleanupFileOperations/GetCleanupFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'

/**
 * @param {string} repoPath
 */
export const cleanupNodeModules = async (repoPath) => {
  try {
    const fileOperations = GetCleanupFileOperations.getCleanupFileOperations(repoPath)
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cleanup node_modules: ${errorMessage}`)
  }
}