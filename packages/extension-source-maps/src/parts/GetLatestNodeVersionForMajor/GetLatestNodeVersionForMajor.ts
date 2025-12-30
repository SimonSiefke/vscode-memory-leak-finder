import { VError } from '@lvce-editor/verror'
import { launchNetworkWorker } from '../LaunchNetworkWorker/LaunchNetworkWorker.ts'

const NODE_VERSION_REGEX = /^v(\d+)\.(\d+)\.(\d+)$/

interface NodeVersionInfo {
  version: string
}

interface ParsedVersion {
  major: number
  minor: number
  patch: number
  version: string
}

export const getLatestNodeVersionForMajor = async (majorVersion: string): Promise<string> => {
  try {
    await using networkWorker = await launchNetworkWorker()
    const versions = (await networkWorker.invoke('Network.getJson', 'https://nodejs.org/dist/index.json')) as NodeVersionInfo[]
    const majorVersionNum = parseInt(majorVersion, 10)

    // Filter versions for the specified major version and find the latest
    const matchingVersions = versions
      .filter((v) => {
        const versionMatch = v.version.match(NODE_VERSION_REGEX)
        if (!versionMatch) {
          return false
        }
        const major = parseInt(versionMatch[1], 10)
        return major === majorVersionNum
      })
      .map((v) => {
        const versionMatch = v.version.match(NODE_VERSION_REGEX)
        if (!versionMatch) {
          return null
        }
        return {
          major: parseInt(versionMatch[1], 10),
          minor: parseInt(versionMatch[2], 10),
          patch: parseInt(versionMatch[3], 10),
          version: v.version,
        }
      })
      .filter((v): v is ParsedVersion => v !== null)
      .sort((a, b) => {
        if (a.major !== b.major) {
          return b.major - a.major
        }
        if (a.minor !== b.minor) {
          return b.minor - a.minor
        }
        return b.patch - a.patch
      })

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

