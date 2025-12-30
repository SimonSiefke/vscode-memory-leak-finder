import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'
import { getLatestNodeVersionForMajor } from '../GetLatestNodeVersionForMajor/GetLatestNodeVersionForMajor.ts'
import * as ReadJson from '../ReadJson/ReadJson.ts'

const NODE_VERSION_REGEX = /(\d+)\.?(\d+)?\.?(\d+)?/

export const getNodeVersion = async (repoPath: string): Promise<string> => {
  try {
    const packageJsonPath = join(repoPath, 'package.json')
    const packageJson = await ReadJson.readJson(packageJsonPath)
    const engines = packageJson.engines
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
