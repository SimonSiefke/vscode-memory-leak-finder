import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getLatestNodeVersionForMajor } from '../GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts'
import * as ReadJson from '../ReadJson/ReadJson.ts'

const NODE_VERSION_REGEX = /(\d+)\.?(\d+)?\.?(\d+)?/

const parseNodeVersionFromNvmrc = (content: string): string | null => {
  const trimmed = content.trim()
  if (!trimmed) {
    return null
  }
  // Remove 'v' prefix if present
  const version = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed
  // Check if it's a full version (e.g., "18.20.0") or just major (e.g., "18")
  const match = version.match(/^(\d+)(?:\.(\d+)(?:\.(\d+))?)?$/)
  if (!match) {
    return null
  }
  // If it's a full version (has at least minor version), return it
  if (match[2] !== undefined) {
    // Ensure we have patch version, default to 0 if missing
    const patch = match[3] === undefined ? '0' : match[3]
    return `${match[1]}.${match[2]}.${patch}`
  }
  // If it's just a major version, return it so we can fetch latest
  return match[1]
}

export const getNodeVersion = async (repoPath: string): Promise<string> => {
  try {
    // First, check for .nvmrc file
    const nvmrcPath = join(repoPath, '.nvmrc')
    if (existsSync(nvmrcPath)) {
      try {
        const nvmrcContent = await readFile(nvmrcPath, 'utf8')
        const parsedVersion = parseNodeVersionFromNvmrc(nvmrcContent)
        if (parsedVersion) {
          // If it's a full version (contains dots), return it directly
          if (parsedVersion.includes('.')) {
            return parsedVersion
          }
          // If it's just a major version, fetch the latest for that major
          return await getLatestNodeVersionForMajor(parsedVersion)
        }
      } catch {
        // If .nvmrc exists but can't be read/parsed, fall through to package.json
      }
    }

    // Fall back to package.json engines.node
    const packageJsonPath = join(repoPath, 'package.json')
    const packageJson = await ReadJson.readJson(packageJsonPath)
    const { engines } = packageJson
    if (!engines || !engines.node) {
      throw new Error('No node version specified in package.json engines')
    }
    const nodeVersion = engines.node
    // Extract major version number (e.g., ">=22.14.0" -> "22" or "18" -> "18")
    const match = nodeVersion.match(NODE_VERSION_REGEX)
    if (!match) {
      throw new Error(`Could not parse node version from: ${nodeVersion}`)
    }
    const major = match[1]
    // Fetch the latest version for this major version
    return await getLatestNodeVersionForMajor(major)
  } catch (error) {
    throw new VError(error, `Failed to get node version from '${repoPath}'`)
  }
}
