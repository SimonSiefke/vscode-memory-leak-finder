import * as FetchVscodeApi from '../FetchVscodeApi/FetchVscodeApi.ts'
import * as GetVscodePlatformName from '../GetVscodePlatformName/GetVscodePlatformName.ts'

export interface Commit {
  readonly commit: string
}

export const fetchCommits = async (platform: string, arch: string, updateUrl: string): Promise<Commit[]> => {
  const platformName = GetVscodePlatformName.getVscodePlatformName(platform, arch)
  const url = `${updateUrl}/api/commits/insider/${platformName}?released=false`
  const commitHashes = await FetchVscodeApi.fetchVscodeApi<string[]>(url)
  const recentCommits = commitHashes.slice(0, 200).map((commit) => ({
    commit,
  }))
  return recentCommits
}
