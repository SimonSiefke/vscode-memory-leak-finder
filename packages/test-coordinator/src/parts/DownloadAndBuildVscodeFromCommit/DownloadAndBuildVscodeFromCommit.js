import { downloadAndBuildVscodeFromCommit as downloadAndBuildVscodeFromCommitImpl } from '../../../../repository-process/src/main.js'

/**
 * @param {string} commitHash
 */
export const downloadAndBuildVscodeFromCommit = async (commitHash) => {
  return await downloadAndBuildVscodeFromCommitImpl(commitHash)
}
