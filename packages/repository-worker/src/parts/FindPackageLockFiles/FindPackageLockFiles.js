import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Recursively finds all package-lock.json files in a directory
 * @param {string} dir - Directory to search in
 * @param {string[]} results - Array to accumulate results (used for recursion)
 * @returns {Promise<string[]>} - Array of full paths to package-lock.json files
 */
export const findPackageLockFiles = async (dir, results = []) => {
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