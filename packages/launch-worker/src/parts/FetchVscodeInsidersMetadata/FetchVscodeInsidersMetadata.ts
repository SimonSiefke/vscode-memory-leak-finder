import * as GetVscodePlatformName from '../GetVscodePlatformName/GetVscodePlatformName.ts'
import * as VError from '../VError/VError.ts'

export interface IBuildMetadata {
  readonly productVersion: string
  readonly sha256hash: string
  readonly url: string
  readonly version: string
}

export const fetchVscodeInsidersMetadata = async (platform: string, arch: string, commit: string, updateUrl: string): Promise<IBuildMetadata> => {
  const platformName = GetVscodePlatformName.getVscodePlatformName(platform, arch)
  const quality = 'insider'
  const url = `${updateUrl}/api/versions/commit:${commit}/${platformName}/${quality}`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vscode-memory-leak-finder/1.0.0',
      },
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const metadata = (await response.json()) as IBuildMetadata
    return metadata
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error(`Request timeout for URL: ${url}`)
    }
    throw new VError.VError(error, `Failed to fetch VS Code Insiders metadata for commit ${commit} from URL: ${url}`)
  }
}
