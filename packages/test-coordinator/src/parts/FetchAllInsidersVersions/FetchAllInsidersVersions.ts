import * as os from 'node:os'
import * as FetchVscodeApi from '../FetchVscodeApi/FetchVscodeApi.ts'
import * as GetVscodePlatformName from '../GetVscodePlatformName/GetVscodePlatformName.ts'

export interface IVersionMetadata {
  readonly commit: string
  readonly productVersion: string
  readonly sha256hash: string
  readonly url: string
  readonly version: string
}

export const fetchAllInsidersVersions = async (): Promise<IVersionMetadata[]> => {
  const platformName = GetVscodePlatformName.getVscodePlatformName(process.platform, os.arch())
  const quality = 'insider'
  const url = `https://update.code.visualstudio.com/api/versions/${platformName}/${quality}`
  const versions = await FetchVscodeApi.fetchVscodeApi<IVersionMetadata[]>(url)
  return versions
}
