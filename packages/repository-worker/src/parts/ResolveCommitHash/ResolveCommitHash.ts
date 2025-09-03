import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'
import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.ts'
import { parseCommitHash } from '../ParseCommitHash/ParseCommitHash.ts'

export interface ResolvedCommit {
  repoUrl: string
  commitHash: string
}

const DEFAULT_REPO_URL = 'https://github.com/microsoft/vscode.git'

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

/**
 * Construct fork repository URL from owner
 */
const constructForkRepoUrl = (owner: string): string => {
  return `https://github.com/${owner}/vscode.git`
}

export const resolveCommitHash = async (baseRepoUrl: string | null, commitRef: string): Promise<ResolvedCommit> => {
  try {
    // Use default repository if none provided
    const defaultRepoUrl = baseRepoUrl || DEFAULT_REPO_URL
    
    // Check if this is a fork commit (owner/commit format)
    const forkCommitInfo = parseForkCommit(commitRef)
    
    let actualRepoUrl: string
    let actualCommitRef: string
    
    if (forkCommitInfo) {
      // Fork commit: use fork repository URL
      actualRepoUrl = constructForkRepoUrl(forkCommitInfo.owner)
      actualCommitRef = forkCommitInfo.commit
    } else {
      // Regular commit: use provided or default repository URL
      actualRepoUrl = defaultRepoUrl
      actualCommitRef = commitRef
    }

    // If it's already a full commit hash, return it directly
    if (isFullCommitHash(actualCommitRef)) {
      return {
        repoUrl: actualRepoUrl,
        commitHash: actualCommitRef
      }
    }

    // Resolve the commit reference to a full hash
    const result = await exec('git', ['ls-remote', actualRepoUrl, actualCommitRef])
    const resolvedHash = parseCommitHash(result.stdout, actualCommitRef)

    return {
      repoUrl: actualRepoUrl,
      commitHash: resolvedHash
    }
  } catch (error) {
    throw new VError(error, `Failed to resolve commit reference '${commitRef}'`)
  }
}
