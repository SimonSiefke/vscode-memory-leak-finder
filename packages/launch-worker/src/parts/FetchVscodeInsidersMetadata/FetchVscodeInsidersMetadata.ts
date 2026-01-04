import { getJson } from '../GetJson/GetJson.ts'
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
  const platformName = GetVscodePlatformName.getVscodePlatformName(platform, arch)
  const quality = 'insider'
  const url = `${updateUrl}/api/versions/commit:${commit}/${platformName}/${quality}`
  try {
    const metadata = await getJson(url)
    return metadata
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Request timeout for URL: ${url}`)
    }
    throw new VError.VError(error, `Failed to fetch VS Code Insiders metadata for commit ${commit} from URL: ${url}`)
  }
}
