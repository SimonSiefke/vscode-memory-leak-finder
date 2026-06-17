import { computeVscodeNodeModulesCacheKeyFromCommit } from '../ComputeVscodeNodeModulesCacheKeyFromCommit/ComputeVscodeNodeModulesCacheKeyFromCommit.ts'
import { downloadAndBuildVscodeFromCommit } from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.ts'
import { resolveVscodeCommitHashFromCommit } from '../ResolveVscodeCommitHashFromCommit/ResolveVscodeCommitHashFromCommit.ts'

export const commandMap = {
  'Repository.computeVscodeNodeModulesCacheKeyFromCommit': computeVscodeNodeModulesCacheKeyFromCommit,
  'Repository.downloadAndBuildVscodeFromCommit': downloadAndBuildVscodeFromCommit,
  'Repository.resolveVscodeCommitHashFromCommit': resolveVscodeCommitHashFromCommit,
}
