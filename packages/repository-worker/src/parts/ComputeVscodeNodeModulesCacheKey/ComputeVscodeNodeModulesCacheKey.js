import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * @param {string} repoPath
 */
export const computeVscodeNodeModulesCacheKey = async (repoPath) => {
  try {
    const packageLockFiles = await findPackageLockFiles(repoPath)
    const contents = await Promise.all(packageLockFiles.map((file) => readFile(file, 'utf8')))

    const hash = createHash('sha1')
    for (const content of contents) {
      hash.update(content)
    }

    return hash.digest('hex')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to compute VS Code node_modules cache key: ${errorMessage}`)
  }
}

/**
 * @param {string} dir
 * @param {string[]} results
 */
const findPackageLockFiles = async (dir, results = []) => {
  try {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip node_modules and .git directories
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue
        }
        // Recursively search subdirectories
        await findPackageLockFiles(fullPath, results)
      } else if (entry.name === 'package-lock.json') {
        results.push(fullPath)
      }
    }

    return results
  } catch (error) {
    // Ignore permission errors or other issues when reading directories
    return results
  }
}
