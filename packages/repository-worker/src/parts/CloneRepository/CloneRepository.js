import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { execa } from 'execa'
import { pathExists } from 'path-exists'
import * as Root from '../Root/Root.js'

/**
 * Clones a repository to a local directory
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} repoPath - The local path where to clone the repository
 * @returns {Promise<void>}
 */
export const cloneRepository = async (repoUrl, repoPath) => {
  // Create parent directory if it doesn't exist
  const parentDir = join(repoPath, '..')
  if (!(await pathExists(parentDir))) {
    await mkdir(parentDir, { recursive: true })
  }

  // Check if repo already exists
  if (await pathExists(repoPath)) {
    console.log(`Repository already exists at ${repoPath}, skipping clone...`)
  } else {
    console.log(`Cloning repository from ${repoUrl}...`)
    await execa('git', ['clone', '--depth', '1', repoUrl, repoPath])
  }
}