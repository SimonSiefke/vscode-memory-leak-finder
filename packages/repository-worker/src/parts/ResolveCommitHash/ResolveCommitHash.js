import { execa } from 'execa'
import { VError } from '@lvce-editor/verror'
import { isFullCommitHash } from '../IsFullCommitHash/IsFullCommitHash.js'
import { parseCommitHash } from '../ParseCommitHash/ParseCommitHash.js'

export const resolveCommitHash = async (repoUrl, commitRef) => {
  try {
    if (isFullCommitHash(commitRef)) {
      return commitRef
    }

    const { stdout } = await execa('git', ['ls-remote', repoUrl, commitRef])

    return parseCommitHash(stdout, commitRef)
  } catch (error) {
    throw new VError(error, `Failed to resolve commit reference '${commitRef}'`)
  }
}
