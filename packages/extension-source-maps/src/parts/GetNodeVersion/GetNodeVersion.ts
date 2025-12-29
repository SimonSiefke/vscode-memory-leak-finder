import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'

export const getNodeVersion = async (repoPath: string): Promise<string> => {
  try {
    const packageJsonPath = join(repoPath, 'package.json')
    const packageJsonContent = await readFile(packageJsonPath, 'utf8')
    const packageJson = JSON.parse(packageJsonContent)
    const engines = packageJson.engines
    if (!engines || !engines.node) {
      throw new Error('No node version specified in package.json engines')
    }
    const nodeVersion = engines.node
    // Extract version number (e.g., ">=18.0.0" -> "18.0.0" or "18" -> "18")
    const match = nodeVersion.match(/(\d+)\.?(\d+)?\.?(\d+)?/)
    if (!match) {
      throw new Error(`Could not parse node version from: ${nodeVersion}`)
    }
    const major = match[1]
    const minor = match[2] || '0'
    const patch = match[3] || '0'
    return `${major}.${minor}.${patch}`
  } catch (error) {
    throw new VError(error, `Failed to get node version from '${repoPath}'`)
  }
}
