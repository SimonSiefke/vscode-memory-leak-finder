import * as RepositoryWorker from '../RepositoryWorker/RepositoryWorker.ts'

export const downloadAndBuildVscodeFromCommit = async (
  platform: string,
  arch: string,
  commitHash: string,
  repoUrl: string,
  reposDir: string,
  nodeModulesCacheDir: string,
  useNice: boolean,
): Promise<string> => {
  await using rpc = await RepositoryWorker.launch()
  const path = await rpc.invoke('Repository.downloadAndBuildVscodeFromCommit', platform, arch, commitHash, repoUrl, reposDir, nodeModulesCacheDir, useNice)
  return path
}
