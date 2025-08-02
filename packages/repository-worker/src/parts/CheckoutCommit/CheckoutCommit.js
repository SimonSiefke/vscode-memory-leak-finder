import { execa } from 'execa'
import { pathExists } from 'path-exists'

/**
 * Checks out a specific commit in a repository
 * @param {string} repoPath - The path to the repository
 * @param {string} commit - The commit hash to checkout
 * @returns {Promise<void>}
 */
export const checkoutCommit = async (repoPath, commit) => {
  // Check if repository exists
  if (!(await pathExists(repoPath))) {
    throw new Error(`Repository not found at ${repoPath}`)
  }

  console.log(`Checking out commit ${commit}...`)
  await execa('git', ['checkout', commit], { cwd: repoPath })
}
