import { VError } from '@lvce-editor/verror'
import * as os from 'node:os'
import * as GetVscodePlatformName from '../GetVscodePlatformName/GetVscodePlatformName.ts'

export interface IBuildMetadata {
  readonly url: string
  readonly version: string
  readonly productVersion: string
  readonly sha256hash: string
}

export const fetchVscodeInsidersMetadata = async (commit: string): Promise<IBuildMetadata> => {
<<<<<<< HEAD
  try {
    const platformName = GetVscodePlatformName.getVscodePlatformName(process.platform, os.arch())
    const quality = 'insider'
    const url = `https://update.code.visualstudio.com/api/versions/commit:${commit}/${platformName}/${quality}`

=======
  const platformName = GetVscodePlatformName.getVscodePlatformName(process.platform, os.arch())
  const quality = 'insider'
  const url = `https://update.code.visualstudio.com/api/versions/commit:${commit}/${platformName}/${quality}`

  try {
>>>>>>> origin/main
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'vscode-memory-leak-finder/1.0.0',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const metadata = (await response.json()) as IBuildMetadata
    return metadata
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
<<<<<<< HEAD
      throw new Error('Request timeout')
    }
    throw new VError(error, `Failed to fetch VS Code Insiders metadata for commit ${commit}`)
=======
      throw new Error(`Request timeout for URL: ${url}`)
    }
    throw new VError(error, `Failed to fetch VS Code Insiders metadata for commit ${commit} from URL: ${url}`)
>>>>>>> origin/main
  }
}
