import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.js'

export const parseCommitHash = (stdout, commitRef) => {
  const lines = stdout.trim().split('\n')
  if (lines.length === 0 || lines[0] === '') {
    throw new Error(`No commit found for reference '${commitRef}'`)
  }

  const commitHash = lines[0].slice(0, 40)

  if (!isFullCommitHash(commitHash)) {
    throw new Error(`Invalid commit hash resolved: ${commitHash}`)
  }

  return commitHash
}