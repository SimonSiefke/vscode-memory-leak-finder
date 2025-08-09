import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.ts'
import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.ts'
import { parseCommitHash } from '../ParseCommitHash/ParseCommitHash.ts'

export const resolveCommitHash = async (repoUrl, commitRef) => {
  try {
    if (isFullCommitHash(commitRef)) {
      return commitRef
    }

    const result = await exec('git', ['ls-remote', repoUrl, commitRef])

    return parseCommitHash(result.stdout, commitRef)
  } catch (error) {
    throw new VError(error, `Failed to resolve commit reference '${commitRef}'`)
  }
}
