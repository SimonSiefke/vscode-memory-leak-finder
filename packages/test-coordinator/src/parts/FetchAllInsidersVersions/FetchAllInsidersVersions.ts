import * as FetchCommits from '../FetchCommits/FetchCommits.ts'

export interface IVersionMetadata {
  readonly commit: string
  readonly productVersion: string
  readonly sha256hash: string
  readonly url: string
  readonly version: string
}

export const fetchAllInsidersVersions = async (): Promise<IVersionMetadata[]> => {
  const commits = await FetchCommits.fetchCommits()
  const versions: IVersionMetadata[] = commits.map((commit) => ({
    commit: commit.commit,
    productVersion: '',
    sha256hash: '',
    url: '',
    version: '',
  }))
  return versions
}
