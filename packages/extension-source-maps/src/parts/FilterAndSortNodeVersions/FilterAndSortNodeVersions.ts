import type { NodeVersionInfo, ParsedVersion } from '../NodeVersionTypes/NodeVersionTypes.ts'

const NODE_VERSION_REGEX = /^v(\d+)\.(\d+)\.(\d+)$/

const filterByMajorVersion = (majorVersion: number) => {
  return (v: NodeVersionInfo): boolean => {
    const versionMatch = v.version.match(NODE_VERSION_REGEX)
    if (!versionMatch) {
      return false
    }
    const major = Number.parseInt(versionMatch[1], 10)
    return major === majorVersion
  }
}

const parseVersion = (v: NodeVersionInfo): ParsedVersion | null => {
  const versionMatch = v.version.match(NODE_VERSION_REGEX)
  if (!versionMatch) {
    return null
  }
  return {
    major: Number.parseInt(versionMatch[1], 10),
    minor: Number.parseInt(versionMatch[2], 10),
    patch: Number.parseInt(versionMatch[3], 10),
    version: v.version,
  }
}

const isNotNull = (v: ParsedVersion | null): v is ParsedVersion => {
  return v !== null
}

const compareVersions = (a: ParsedVersion, b: ParsedVersion): number => {
  if (a.major !== b.major) {
    return b.major - a.major
  }
  if (a.minor !== b.minor) {
    return b.minor - a.minor
  }
  return b.patch - a.patch
}

export const filterAndSortNodeVersions = (versions: readonly NodeVersionInfo[], majorVersion: number): readonly ParsedVersion[] => {
  const matchingVersions = versions.filter(filterByMajorVersion(majorVersion)).map(parseVersion).filter(isNotNull).sort(compareVersions)

  return matchingVersions
}
