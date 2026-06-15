import { rm } from 'node:fs/promises'
import * as Assert from '../Assert/Assert.ts'
import { checkoutVscodeLockfilesAtCommit } from '../CheckoutVscodeLockfilesAtCommit/CheckoutVscodeLockfilesAtCommit.ts'
import { computeVscodeNodeModulesCacheKey } from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.ts'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.ts'
import * as VerboseLog from '../VerboseLog/VerboseLog.ts'

export const computeVscodeNodeModulesCacheKeyFromCommit = async (
  commitRef: string,
  repoUrl: string,
  verbose: boolean = false,
): Promise<string> => {
  Assert.string(commitRef)
  Assert.string(repoUrl)
  Assert.boolean(verbose)

  if (verbose) {
    await VerboseLog.write(`Resolving VS Code commit ref '${commitRef}'...\n`)
  }
  const { commitHash, owner } = await ResolveCommitHash.resolveCommitHash(repoUrl, commitRef)
  if (verbose) {
    await VerboseLog.write(`Resolved commit ref '${commitRef}' to ${commitHash}.\n`)
  }
  const resolvedRepoUrl = `https://github.com/${owner}/vscode.git`
  const repoPathWithCommitHash = await checkoutVscodeLockfilesAtCommit(resolvedRepoUrl, commitHash, verbose)

  try {
    if (verbose) {
      await VerboseLog.write('Computing node modules cache key from lockfiles...\n')
    }
    const cacheKey = await computeVscodeNodeModulesCacheKey(repoPathWithCommitHash)
    return cacheKey
  } finally {
    if (verbose) {
      await VerboseLog.write('Cleaning up temporary checkout...\n')
    }
    await rm(repoPathWithCommitHash, { force: true, recursive: true })
  }
}
