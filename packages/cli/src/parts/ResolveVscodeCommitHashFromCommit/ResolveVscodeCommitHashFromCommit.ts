import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.ts'
import * as Stdout from '../Stdout/Stdout.ts'

export const resolveVscodeCommitHashFromCommit = async (commitRef: string): Promise<void> => {
  if (!commitRef) {
    throw new Error('--commit is required when --resolve-vscode-commit-hash is used')
  }
  const repoUrl = 'https://github.com/microsoft/vscode.git'
  await using rpc = await RepositoryWorker.launch()
  const commitHash = await rpc.invoke('Repository.resolveVscodeCommitHashFromCommit', commitRef, repoUrl)
  await Stdout.write(`${commitHash}\n`)
}
