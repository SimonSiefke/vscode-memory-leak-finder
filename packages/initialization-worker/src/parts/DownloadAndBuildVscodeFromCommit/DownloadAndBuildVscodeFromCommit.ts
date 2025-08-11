import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.ts'

export const downloadAndBuildVscodeFromCommit = async (commitHash: string): Promise<string> => {
  const rpc = await RepositoryWorker.launch()
  const path = await rpc.invoke('Download.downloadAndBuildVscodeFromCommit', commitHash)
  await rpc.dispose()
  return path
}
