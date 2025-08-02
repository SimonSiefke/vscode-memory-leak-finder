import { exec } from '../Exec/Exec.js'

export const checkoutCommit = async (repoPath, commit) => {
  await exec('git', ['checkout', commit], { cwd: repoPath })
}
