import { join } from 'node:path'
import { existsSync } from 'node:fs'

/**
 * @typedef {Object} FileOperation
 * @property {'copy' | 'remove'} type
 * @property {string} from
 * @property {string} to
 */

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