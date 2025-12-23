import { exec } from '../Exec/Exec.ts'

export const checkoutCommit = async (repoPath: string, commit: string): Promise<void> => {
  await exec('git', ['checkout', commit], { cwd: repoPath })
}
