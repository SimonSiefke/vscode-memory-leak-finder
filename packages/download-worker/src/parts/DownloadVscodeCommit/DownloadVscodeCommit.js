import { join } from 'node:path'
import { access, mkdir } from 'node:fs/promises'
import { execa } from 'execa'
import * as Root from '../Root/Root.js'

const VSCODE_REPOS_DIR = '.vscode-repos'

/**
 * Checks if a file or directory exists
 * @param {string} path - The path to check
 * @returns {Promise<boolean>} True if the path exists, false otherwise
 */
const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Downloads and checks out a specific VS Code commit
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} commit - The commit hash to checkout
 * @param {string} outFolder - The output folder path
 * @returns {Promise<string>} The path to the downloaded repository
 */
export const downloadVscodeCommit = async (repoUrl, commit, outFolder) => {
  const reposDir = join(Root.root, VSCODE_REPOS_DIR)
  const repoPath = join(reposDir, commit)

  // Create repos directory if it doesn't exist
  if (!(await exists(reposDir))) {
    await mkdir(reposDir, { recursive: true })
  }

  // Check if repo already exists
  if (!(await exists(repoPath))) {
    console.log(`Cloning VS Code repository for commit ${commit}...`)

    // Clone the repository first
    await execa('git', ['clone', '--depth', '1', repoUrl, repoPath])

    // Then checkout the specific commit
    await execa('git', ['checkout', commit], { cwd: repoPath })
  } else {
    console.log(`VS Code repository for commit ${commit} already exists, skipping clone...`)
  }

  return repoPath
}