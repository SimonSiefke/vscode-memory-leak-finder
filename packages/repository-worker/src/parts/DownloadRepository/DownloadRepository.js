import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import { cloneRepository } from '../CloneRepository/CloneRepository.js'
import { checkoutCommit } from '../CheckoutCommit/CheckoutCommit.js'

const VSCODE_REPOS_DIR = '.vscode-repos'

/**
 * Downloads a repository to a local directory and checks out a specific commit
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} commit - The commit hash to checkout
 * @param {string} outFolder - The output folder path
 * @returns {Promise<string>} The path to the downloaded repository
 */
export const downloadRepository = async (repoUrl, commit, outFolder) => {
  const reposDir = join(Root.root, outFolder)
  const repoPath = join(reposDir, commit)

  // Clone the repository
  await cloneRepository(repoUrl, repoPath)

  // Checkout the specific commit
  await checkoutCommit(repoPath, commit)

  return repoPath
}