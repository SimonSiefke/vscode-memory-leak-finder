import { exec } from '../Exec/Exec.ts'

export const checkoutCommit = async (repoPath, commit) => {
  await exec('git', ['checkout', commit], { cwd: repoPath })
}
