import { exec } from '../Exec/Exec.ts'

export const checkoutCommit = async (repoPath: string, repoUrl: string, commit: string): Promise<void> => {
  const currentHeadResult = await exec('git', ['rev-parse', 'HEAD'], { cwd: repoPath })
  const currentHead = currentHeadResult.stdout.trim()

  if (currentHead === commit) {
    return
  }

  await exec('git', ['remote', 'set-url', 'origin', repoUrl], { cwd: repoPath })
  await exec('git', ['fetch', '--depth', '1', 'origin', commit], { cwd: repoPath })
  await exec('git', ['-c', 'advice.detachedHead=false', 'checkout', 'FETCH_HEAD'], { cwd: repoPath })
}
