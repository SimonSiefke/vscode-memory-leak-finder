import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'
import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.ts'
import { parseCommitHash } from '../ParseCommitHash/ParseCommitHash.ts'

export interface ResolvedCommit {
  readonly owner: string
  readonly commitHash: string
}

/**
 * Parse fork commit format: owner/commit
 * Returns null if not a fork commit format, otherwise returns parsed components
 */
const parseForkCommit = (commitRef: string): { owner: string; commit: string } | null => {
  // Check if commitRef contains a slash and looks like owner/commit format
  const slashIndex = commitRef.indexOf('/')
  if (slashIndex === -1 || slashIndex === 0 || slashIndex === commitRef.length - 1) {
    return null
  }

  const owner = commitRef.slice(0, slashIndex)
  const commit = commitRef.slice(slashIndex + 1)

  // Basic validation
  if (!owner || !commit) {
    return null
  }

  return { owner, commit }
}

export const resolveCommitHash = async (baseRepoUrl: string | null, commitRef: string): Promise<ResolvedCommit> => {
  try {
    // Use default repository if none provided

    // Check if this is a fork commit (owner/commit format)
    const forkCommitInfo = parseForkCommit(commitRef)

    let owner: string
    let actualCommitRef: string

    if (forkCommitInfo) {
      // Fork commit: use fork repository URL
      owner = forkCommitInfo.owner
      actualCommitRef = forkCommitInfo.commit
    } else {
      // Regular commit: use provided or default repository URL
      owner = 'microsoft'
      actualCommitRef = commitRef
    }

    // If it's already a full commit hash, return it directly
    if (isFullCommitHash(actualCommitRef)) {
      return {
        owner,
        commitHash: actualCommitRef,
      }
    }

    // Resolve the commit reference to a full hash
    const result = await exec('git', ['ls-remote', actualRepoUrl, actualCommitRef])
    const resolvedHash = parseCommitHash(result.stdout, actualCommitRef)

    return {
      owner,
      commitHash: resolvedHash,
    }
  } catch (error) {
    throw new VError(error, `Failed to resolve commit reference '${commitRef}'`)
  }
}
