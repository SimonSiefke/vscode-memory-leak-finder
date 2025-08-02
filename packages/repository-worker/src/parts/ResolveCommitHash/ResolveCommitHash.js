import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'
import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.js'
import { parseCommitHash } from '../ParseCommitHash/ParseCommitHash.js'

/**
 * Resolves a commit reference (branch name, tag, or commit hash) to an actual commit hash
 * @param {string} repoUrl - The repository URL (e.g., 'https://github.com/microsoft/vscode.git')
 * @param {string} commitRef - The commit reference (e.g., 'main', 'v1.80.0', 'abc123...')
 * @returns {Promise<string>} The resolved commit hash
 */
export const resolveCommitHash = async (repoUrl, commitRef) => {
  try {
    // If it looks like a full commit hash (40 characters), return it as is
    if (isFullCommitHash(commitRef)) {
      return commitRef
    }

    // Use git ls-remote to get the commit hash for the reference
    const { stdout } = await execa('git', ['ls-remote', repoUrl, commitRef])

    return parseCommitHash(stdout, commitRef)
  } catch (error) {
    throw new VError(error, `Failed to resolve commit reference '${commitRef}'`)
  }
}