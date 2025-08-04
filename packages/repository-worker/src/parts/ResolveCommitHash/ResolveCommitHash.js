import { VError } from '@lvce-editor/verror'
import { exec } from '../Exec/Exec.js'
import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.js'
import { parseCommitHash } from '../ParseCommitHash/ParseCommitHash.js'

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
