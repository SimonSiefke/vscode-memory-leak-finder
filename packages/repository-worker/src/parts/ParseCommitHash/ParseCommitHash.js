import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.js'

/**
 * Parses the output from git ls-remote to extract and validate a commit hash
 * @param {string} stdout - The stdout from git ls-remote command
 * @param {string} commitRef - The original commit reference for error messages
 * @returns {string} The validated commit hash
 * @throws {Error} When no commit is found or the hash is invalid
 */
export const parseCommitHash = (stdout, commitRef) => {
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

  return commitHash
}