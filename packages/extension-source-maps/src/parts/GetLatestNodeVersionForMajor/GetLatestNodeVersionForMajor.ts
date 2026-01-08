import { VError } from '@lvce-editor/verror'
import { filterAndSortNodeVersions } from '../FilterAndSortNodeVersions/FilterAndSortNodeVersions.ts'
import { getJson } from '../GetJson/GetJson.ts'
import type { NodeVersionInfo } from '../NodeVersionTypes/NodeVersionTypes.ts'

export const getLatestNodeVersionForMajor = async (majorVersion: string): Promise<string> => {
  try {
    const versions = await getJson<NodeVersionInfo[]>('https://nodejs.org/dist/index.json')
    const majorVersionNum = Number.parseInt(majorVersion, 10)

    const matchingVersions = filterAndSortNodeVersions(versions, majorVersionNum)

    if (matchingVersions.length === 0) {
      throw new Error(`No Node.js versions found for major version ${majorVersion}`)
    }

    const latestVersion = matchingVersions[0]
    // Return version without 'v' prefix (e.g., "22.21.0" instead of "v22.21.0")
    return `${latestVersion.major}.${latestVersion.minor}.${latestVersion.patch}`
  } catch (error) {
    throw new VError(error, `Failed to fetch latest Node.js version for major version ${majorVersion}`)
  }
}
