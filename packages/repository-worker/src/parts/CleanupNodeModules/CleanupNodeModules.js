import { pathToFileURL } from 'node:url'
import { VError } from '@lvce-editor/verror'
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
    throw new VError(error, `Failed to cleanup node_modules`)
  }
}
