import * as Assert from '../Assert/Assert.ts'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.ts'

export const resolveVscodeCommitHashFromCommit = async (commitRef: string, repoUrl: string): Promise<string> => {
  Assert.string(commitRef)
  Assert.string(repoUrl)

  const { commitHash } = await ResolveCommitHash.resolveCommitHash(repoUrl, commitRef)
  return commitHash
}
