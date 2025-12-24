import * as os from 'node:os'
import * as FetchVscodeApi from '../FetchVscodeApi/FetchVscodeApi.ts'
import * as GetVscodePlatformName from '../GetVscodePlatformName/GetVscodePlatformName.ts'

export interface Commit {
  readonly commit: string
}

export const fetchCommits = async (): Promise<Commit[]> => {
  const platformName = GetVscodePlatformName.getVscodePlatformName(process.platform, os.arch())
  const url = `https://update.code.visualstudio.com/api/commits/insider/${platformName}?released=false`
  const commitHashes = await FetchVscodeApi.fetchVscodeApi<string[]>(url)
  const recentCommits = commitHashes.slice(0, 200).map((commit) => ({
    commit,
  }))
  return recentCommits
}
