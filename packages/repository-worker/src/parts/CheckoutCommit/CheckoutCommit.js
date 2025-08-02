import { execa } from 'execa'

export const checkoutCommit = async (repoPath, commit) => {
  await execa('git', ['checkout', commit], { cwd: repoPath })
}
