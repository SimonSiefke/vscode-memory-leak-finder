import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'
import { cloneRepository } from '../CloneRepository/CloneRepository.js'
import { checkoutCommit } from '../CheckoutCommit/CheckoutCommit.js'
import * as Root from '../Root/Root.js'

/**
 * Downloads VS Code repository to a specific commit
 * @param {string} repoUrl - The repository URL
 * @param {string} commit - The commit hash to checkout
 * @param {string} outFolder - The output folder name
 * @returns {Promise<string>} The path to the downloaded repository
 */
export const downloadVscodeCommit = async (repoUrl, commit, outFolder) => {
  try {
    const reposDir = join(Root.root, outFolder)
    const repoPath = join(reposDir, commit)

    // Clone the repository
    await cloneRepository(repoUrl, repoPath)

    // Checkout the specific commit
    await checkoutCommit(repoPath, commit)

    return repoPath
  } catch (error) {
    throw new VError(error, `Failed to download VS Code commit ${commit}`)
  }
}
