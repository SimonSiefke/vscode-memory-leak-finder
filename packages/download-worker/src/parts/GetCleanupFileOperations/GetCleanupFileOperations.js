import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL, fileURLToPath } from 'node:url'

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
 * @returns {FileOperation[]}
 */
export const getCleanupFileOperations = (repoPathUri) => {
  try {
    const repoPath = fileURLToPath(repoPathUri)
    const nodeModulesPath = join(repoPath, 'node_modules')

    if (existsSync(nodeModulesPath)) {
      console.log('Preparing to cleanup node_modules to save disk space')

      const nodeModulesPathUri = pathToFileURL(nodeModulesPath).href
      return [
        {
          type: /** @type {'remove'} */ ('remove'),
          from: nodeModulesPathUri,
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
