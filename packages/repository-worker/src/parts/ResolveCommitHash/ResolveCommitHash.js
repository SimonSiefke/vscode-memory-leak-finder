import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'

/**
 * Checks if a string is a full 40-character commit hash
 * @param {string} commitRef - The commit reference to check
 * @returns {boolean} True if it's a full commit hash, false otherwise
 */
export const isFullCommitHash = (commitRef) => {
  return /^[a-f0-9]{40}$/i.test(commitRef)
}

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

    console.log(`Resolving commit reference '${commitRef}' to actual commit hash...`)

    // Use git ls-remote to get the commit hash for the reference
    const { stdout } = await execa('git', ['ls-remote', repoUrl, commitRef])

    // Parse the output to get the commit hash
    const lines = stdout.trim().split('\n')
    if (lines.length === 0 || lines[0] === '') {
      throw new Error(`No commit found for reference '${commitRef}'`)
    }

    // Take the first line and extract the commit hash (first 40 characters)
    const commitHash = lines[0].slice(0, 40)

    // Validate that it's a proper commit hash
    if (!isFullCommitHash(commitHash)) {
      throw new Error(`Invalid commit hash resolved: ${commitHash}`)
    }

    console.log(`Resolved '${commitRef}' to commit hash: ${commitHash}`)
    return commitHash
  } catch (error) {
    throw new VError(error, `Failed to resolve commit reference '${commitRef}'`)
  }
}