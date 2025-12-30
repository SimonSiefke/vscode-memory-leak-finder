import type { NodeVersionInfo, ParsedVersion } from '../GetLatestNodeVersionForMajor/NodeVersionTypes.ts'

const NODE_VERSION_REGEX = /^v(\d+)\.(\d+)\.(\d+)$/

export const filterAndSortNodeVersions = (versions: readonly NodeVersionInfo[], majorVersion: number): readonly ParsedVersion[] => {
  const matchingVersions = versions
    .filter((v) => {
      const versionMatch = v.version.match(NODE_VERSION_REGEX)
      if (!versionMatch) {
        return false
      }
      const major = parseInt(versionMatch[1], 10)
      return major === majorVersion
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

  return matchingVersions
}
