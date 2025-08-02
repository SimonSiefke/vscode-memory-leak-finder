import { pathToFileURL } from 'node:url'
import * as GetCleanupFileOperations from '../GetCleanupFileOperations/GetCleanupFileOperations.js'
import * as ApplyFileOperations from '../ApplyFileOperations/ApplyFileOperations.js'

/**
 * @param {string} repoPath
 */
export const cleanupNodeModules = async (repoPath) => {
  try {
    const repoPathUri = pathToFileURL(repoPath).href
    const fileOperations = await GetCleanupFileOperations.getCleanupFileOperations(repoPathUri)
    await ApplyFileOperations.applyFileOperations(fileOperations)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn(`Failed to cleanup node_modules: ${errorMessage}`)
  }
}
