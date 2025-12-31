import { VError } from '@lvce-editor/verror'
import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import type { SourceMapFile } from '../SourceMapFile/SourceMapFile.js'

export const copySourceMaps = async (repoPath: string, outputDir: string, extensionName: string, version: string): Promise<void> => {
  try {
    // Look for source map files in common locations
    const possibleSourceMapDirs = [
      join(repoPath, 'dist'),
      join(repoPath, 'out'),
      join(repoPath, 'build'),
      join(repoPath, 'extension', 'dist'),
      join(repoPath, 'extension', 'out'),
    ]

    const sourceMapFiles: Array<SourceMapFile> = []

    const collectSourceMaps = async (dir: string, baseDir: string): Promise<void> => {
      try {
        const entries = await readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          if (entry.isFile() && entry.name.endsWith('.map')) {
            sourceMapFiles.push({ baseDir, file: fullPath })
          } else if (entry.isDirectory()) {
            await collectSourceMaps(fullPath, baseDir)
          }
        }
      } catch {
        // Directory doesn't exist or can't be read, skip
      }
    }

    for (const dir of possibleSourceMapDirs) {
      await collectSourceMaps(dir, dir)
    }

    if (sourceMapFiles.length === 0) {
      throw new Error('No source map files found in the repository')
    }

    // Copy source maps to cache directory, preserving the directory structure
    // The output should match the cache directory structure:
    // .extension-source-maps-cache/copilot-chat-0.36.2025121004/dist/extension.js.map
    // Note: VS Code extension directories don't have 'v' prefix in version, so strip it if present
    const normalizedVersion = version.startsWith('v') ? version.slice(1) : version
    const extensionId = `${extensionName}-${normalizedVersion}`
    const extensionOutputDir = join(outputDir, extensionId)

    for (const { file: sourceMapFile } of sourceMapFiles) {
      const relativePath = relative(repoPath, sourceMapFile)
      const targetPath = join(extensionOutputDir, relativePath)
      const targetDir = dirname(targetPath)
      await mkdir(targetDir, { recursive: true })
      await cp(sourceMapFile, targetPath)
    }

    // Also copy the corresponding .js files so we have the full context
    // This helps with source map resolution
    for (const { file: sourceMapFile } of sourceMapFiles) {
      const jsFile = sourceMapFile.replace('.map', '')
      try {
        const relativePath = relative(repoPath, jsFile)
        const targetPath = join(extensionOutputDir, relativePath)
        const targetDir = dirname(targetPath)
        await mkdir(targetDir, { recursive: true })
        await cp(jsFile, targetPath)
      } catch {
        // JS file might not exist, that's okay
      }
    }

    return
  } catch (error) {
    throw new VError(error, `Failed to copy source maps from '${repoPath}' to '${outputDir}'`)
  }
}
