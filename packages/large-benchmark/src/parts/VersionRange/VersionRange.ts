import { errorMessage } from '../Io/Io.ts'
import { validateCommits } from '../Series/Series.ts'

export interface StableRelease {
  version: string
  commit: string
}

const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const isStableVersion = (version: string): boolean =>
  stableVersion.test(version) && version.split('.').every((part) => Number.isSafeInteger(Number(part)))
const compareVersions = (a: string, b: string): number => {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let index = 0; index < 3; index++) {
    const difference = left[index]! - right[index]!
    if (difference) return difference
  }
  return 0
}

export const parseVersionRange = (range: string): { from: string; to: string } => {
  const parts = range
    .trim()
    .split('...')
    .map((part) => part.trim())
  if (parts.length !== 2 || !parts.every(isStableVersion))
    throw new Error('version range must have the form 1.120.0...1.130.0 (inclusive stable versions)')
  const [from, to] = parts as [string, string]
  if (compareVersions(from, to) > 0) throw new Error('version range start must not be newer than its end')
  return { from, to }
}

const requestJson = async (url: string): Promise<unknown> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    throw new Error(`Unable to resolve stable VS Code releases from ${url}: ${errorMessage(error)}`)
  }
}

export const resolveVersionRange = async (range: string): Promise<StableRelease[]> => {
  const { from, to } = parseVersionRange(range)
  // released=true excludes stable-channel builds that have not been published yet.
  const available = await requestJson('https://update.code.visualstudio.com/api/releases/stable?released=true')
  if (!Array.isArray(available) || !available.every((version) => typeof version === 'string'))
    throw new Error('Invalid stable VS Code release list')
  for (const endpoint of [from, to])
    if (!available.includes(endpoint)) throw new Error(`VS Code ${endpoint} is not a published stable release`)
  const versions = [...new Set(available as string[])]
    .filter((version) => isStableVersion(version) && compareVersions(version, from) >= 0 && compareVersions(version, to) <= 0)
    .sort(compareVersions)
  if (versions.length < 2 || versions.length > 256)
    throw new Error(`Version range selects ${versions.length} stable releases; select between 2 and 256`)
  const releases: StableRelease[] = []
  for (let start = 0; start < versions.length; start += 8) {
    const batch = await Promise.all(
      versions.slice(start, start + 8).map(async (version): Promise<StableRelease> => {
        const metadata = (await requestJson(
          `https://update.code.visualstudio.com/api/versions/${version}/linux-x64/stable?released=true`,
        )) as { version?: unknown; productVersion?: unknown } | null
        if (
          !metadata ||
          metadata.productVersion !== version ||
          typeof metadata.version !== 'string' ||
          !/^[0-9a-f]{40}$/i.test(metadata.version)
        )
          throw new Error(`Invalid stable Linux x64 release metadata for VS Code ${version}`)
        return { version, commit: metadata.version.toLowerCase() }
      }),
    )
    releases.push(...batch)
  }
  validateCommits(releases.map((release) => release.commit))
  return releases
}

export const resolveLastVersions = async (count: number): Promise<StableRelease[]> => {
  if (!Number.isSafeInteger(count) || count < 2 || count > 256) throw new Error('--last-versions must be between 2 and 256')
  const available = await requestJson('https://update.code.visualstudio.com/api/releases/stable?released=true')
  if (!Array.isArray(available) || !available.every((version) => typeof version === 'string'))
    throw new Error('Invalid stable VS Code release list')
  const versions = [...new Set(available as string[])].filter(isStableVersion).sort(compareVersions).slice(-count)
  if (versions.length !== count) throw new Error(`Only ${versions.length} stable releases available`)
  return resolveVersionRange(`${versions[0]}...${versions.at(-1)}`)
}
