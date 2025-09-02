import { VError } from '@lvce-editor/verror'
import { mkdir } from 'node:fs/promises'
import { exec } from '../Exec/Exec.ts'

/**
 * Clones a repository to a local directory
 * @param {string} repoUrl - The repository URL to clone
 * @param {string} repoPath - The local path where to clone the repository
 * @returns {Promise<void>}
 */
export const cloneRepository = async (repoUrl:string, repoPath:string, commit:string) => {
  try {
    await mkdir(repoPath, {recursive:true})
    await exec('git', ['init'], {cwd: repoPath})
    await exec('git', ['remote', 'add', 'origin', 'repoUrl'])
    await exec('git',['fetch', '--depth', '1', 'origin', commit])
  } catch (error) {
    throw new VError(error, `Failed to clone repository from '${repoUrl}' to '${repoPath}'`)
  }
}
