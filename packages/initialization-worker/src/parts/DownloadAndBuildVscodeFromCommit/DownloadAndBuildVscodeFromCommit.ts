import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.ts'

export const downloadAndBuildVscodeFromCommit = async (commitHash: string): Promise<string> => {
  const rpc = await RepositoryWorker.launch()
  const path = await rpc.invoke('Repository.downloadAndBuildVscodeFromCommit', commitHash)
  await rpc.dispose()
  return path
}
