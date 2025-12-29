import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { VError } from '@lvce-editor/verror'

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

    const sourceMapFiles: Array<{ file: string; baseDir: string }> = []

    for (const dir of possibleSourceMapDirs) {
      try {
        const entries = await readdir(dir, { recursive: true, withFileTypes: true })
        for (const entry of entries) {
          if (entry.isFile() && entry.name.endsWith('.map')) {
            // entry.name is the relative path from dir when using recursive: true
            const fullPath = join(dir, entry.name)
            sourceMapFiles.push({ file: fullPath, baseDir: dir })
          }
        }
      } catch {
        // Directory doesn't exist, skip
      }
    }

    if (sourceMapFiles.length === 0) {
      throw new Error('No source map files found in the repository')
    }

    // Copy source maps to output directory, preserving the directory structure
    // The output should match the extension installation path structure:
    // .vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js.map
    // So we'll create: .extension-source-maps/github.copilot-chat-0.36.2025121004/dist/extension.js.map
    const extensionId = `github.${extensionName}-${version}`
    const extensionOutputDir = join(outputDir, extensionId)

    for (const { file: sourceMapFile, baseDir } of sourceMapFiles) {
      const relativePath = relative(baseDir, sourceMapFile)
      const targetPath = join(extensionOutputDir, relativePath)
      const targetDir = dirname(targetPath)
      await mkdir(targetDir, { recursive: true })
      await cp(sourceMapFile, targetPath)
    }

    // Also copy the corresponding .js files so we have the full context
    // This helps with source map resolution
    for (const { file: sourceMapFile, baseDir } of sourceMapFiles) {
      const jsFile = sourceMapFile.replace('.map', '')
      try {
        const relativePath = relative(baseDir, jsFile)
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
