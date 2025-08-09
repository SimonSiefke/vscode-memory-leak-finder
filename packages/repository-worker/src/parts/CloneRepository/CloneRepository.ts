import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'

/**
 * Clones a repository to a local directory
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} repoPath - The local path where to clone the repository
 * @returns {Promise<void>}
 */
export const cloneRepository = async (repoUrl, repoPath) => {
  try {
    await exec('git', ['clone', '--depth', '1', repoUrl, repoPath])
  } catch (error) {
    throw new VError(error, `Failed to clone repository from '${repoUrl}' to '${repoPath}'`)
  }
}
