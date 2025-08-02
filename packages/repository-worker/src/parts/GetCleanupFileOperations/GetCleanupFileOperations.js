import { fileURLToPath } from 'node:url'
import { pathExists } from 'path-exists'

/**
 * @typedef {Object} RemoveOperation
 * @property {'remove'} type
 * @property {string} from
 */

/**
 * @typedef {RemoveOperation} FileOperation
 */

/**
 * @param {string} repoPathUri - File URI of the repository path
 * @returns {Promise<FileOperation[]>}
 */
export const getCleanupFileOperations = async (repoPathUri) => {
  try {
    const repoPath = fileURLToPath(repoPathUri)
    const nodeModulesPath = new URL('node_modules', repoPathUri).href

    if (await pathExists(repoPath + '/node_modules')) {
      console.log('Preparing to cleanup node_modules to save disk space')

      return [
        {
          type: /** @type {'remove'} */ ('remove'),
          from: nodeModulesPath,
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
