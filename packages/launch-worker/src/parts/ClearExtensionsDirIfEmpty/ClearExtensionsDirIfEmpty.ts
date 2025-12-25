import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import { join } from '../Path/Path.ts'

export const clearExtensionsDirIfEmpty = async (
  extensionsDir: string,
): Promise<void> => {
  // Only clear extensions directory if it's empty or doesn't exist
  // This preserves installed extensions across test runs
  try {
    const entries = await readdir(extensionsDir)
    // Check if there are any extension directories (not just files)
    let hasExtensions = false
    for (const entry of entries) {
      const entryPath = join(extensionsDir, entry)
      const entryStat = await stat(entryPath)
      if (entryStat.isDirectory()) {
        hasExtensions = true
        break
      }
    }
    if (!hasExtensions) {
      await rm(extensionsDir, { force: true, recursive: true })
      await mkdir(extensionsDir)
    }
  } catch {
    // Directory doesn't exist, create it
    await mkdir(extensionsDir, { recursive: true })
  }
}
