<<<<<<< HEAD
import { getJson } from '../GetJson/GetJson.ts'
=======
import * as ComputeVscodeInsidersMetadataCacheKey from '../ComputeVscodeInsidersMetadataCacheKey/ComputeVscodeInsidersMetadataCacheKey.ts'
import * as GetJsonCached from '../GetJsonCached/GetJsonCached.ts'
>>>>>>> origin/main
import * as GetVscodePlatformName from '../GetVscodePlatformName/GetVscodePlatformName.ts'
import * as VError from '../VError/VError.ts'

export interface IBuildMetadata {
  readonly productVersion: string
  readonly sha256hash: string
  readonly url: string
  readonly version: string
}

export const fetchVscodeInsidersMetadata = async (
  platform: string,
  arch: string,
  commit: string,
  updateUrl: string,
): Promise<IBuildMetadata> => {
  const cacheKey = ComputeVscodeInsidersMetadataCacheKey.computeVscodeInsidersMetadataCacheKey(platform, arch, commit)
  const platformName = GetVscodePlatformName.getVscodePlatformName(platform, arch)
  const quality = 'insider'
  const url = `${updateUrl}/api/versions/commit:${commit}/${platformName}/${quality}`
  try {
<<<<<<< HEAD
    const metadata = await getJson(url)
    return metadata
=======
    return await GetJsonCached.getJsonCached<IBuildMetadata>(url, cacheKey, '.vscode-insiders-metadata')
>>>>>>> origin/main
  } catch (error) {
    throw new VError.VError(error, `Failed to fetch VS Code Insiders metadata for commit ${commit} from URL: ${url}`)
  }
}
