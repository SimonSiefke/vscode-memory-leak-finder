import { readdir, stat, mkdir, cp } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const artifactPattern = 'vscode-memory-leak-finder-results-linux-'

export type CopyEntry = (sourcePath: string, targetPath: string) => Promise<void>

export type MergeDirectoryContentsOptions = {
  sourceDir: string
  targetDir: string
  copyEntry?: CopyEntry
  logger?: Pick<Console, 'error' | 'log'>
}

export type MergeArtifactsOptions = {
  root?: string
  targetDir?: string
  pattern?: string
  logger?: Pick<Console, 'error' | 'log'>
}

const defaultRoot = join(import.meta.dirname, '../../..')
const defaultTargetDir = join(defaultRoot, '.vscode-memory-leak-finder-results')

const copySourceEntry = async (sourcePath: string, targetPath: string): Promise<void> => {
  const entryStats = await stat(sourcePath)
  if (entryStats.isDirectory()) {
    await cp(sourcePath, targetPath, { recursive: true, force: true })
    return
  }

  await cp(sourcePath, targetPath, { force: true })
}

export const mergeDirectoryContents = async ({
  sourceDir,
  targetDir,
  copyEntry = copySourceEntry,
  logger = console,
}: MergeDirectoryContentsOptions): Promise<{ copied: number; skipped: number; total: number }> => {
  const entries = await readdir(sourceDir)
  let copied = 0
  let skipped = 0

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry)
    const targetPath = join(targetDir, entry)

    try {
      await copyEntry(sourcePath, targetPath)
      copied++
    } catch (error) {
      skipped++
      logger.error(`   ✗ Error copying ${entry}:`, error)
    }
  }

  return { copied, skipped, total: entries.length }
}

export const mergeArtifacts = async ({
  root = defaultRoot,
  targetDir = defaultTargetDir,
  pattern = artifactPattern,
  logger = console,
}: MergeArtifactsOptions = {}): Promise<void> => {
  logger.log('Starting artifact merge process...')
  logger.log(`Root directory: ${root}`)
  logger.log(`Target directory: ${targetDir}`)
  logger.log(`Pattern to match: ${pattern}*`)

  await mkdir(targetDir, { recursive: true })
  logger.log(`✓ Created/verified target directory: ${targetDir}`)

  const entries = await readdir(root)
  logger.log(`\nFound ${entries.length} entries in root directory`)

  const allDirs: string[] = []
  for (const entry of entries) {
    const entryPath = join(root, entry)
    try {
      const stats = await stat(entryPath)
      if (stats.isDirectory()) {
        allDirs.push(entry)
      }
    } catch {
      // Skip entries that can't be stat'd
    }
  }
  logger.log(`\nFound ${allDirs.length} directories total:`)
  for (const dir of allDirs.slice(0, 20)) {
    logger.log(`  - ${dir}`)
  }
  if (allDirs.length > 20) {
    logger.log(`  ... and ${allDirs.length - 20} more`)
  }

  const matchingDirs: string[] = []
  for (const entry of entries) {
    if (entry.startsWith(pattern)) {
      const entryPath = join(root, entry)
      try {
        const stats = await stat(entryPath)
        if (stats.isDirectory()) {
          matchingDirs.push(entry)
        }
      } catch (error) {
        logger.log(`  ⚠️  Could not stat ${entry}: ${(error as Error).message}`)
      }
    }
  }

  logger.log(`\nFound ${matchingDirs.length} directories matching pattern "${pattern}*":`)
  for (const dir of matchingDirs) {
    logger.log(`  - ${dir}`)
  }

  if (matchingDirs.length === 0) {
    logger.log('\n⚠️  No matching directories found. Nothing to merge.')
    return
  }

  for (const dir of matchingDirs) {
    const dirPath = join(root, dir)
    logger.log(`\n📁 Processing directory: ${dir}`)
    logger.log(`   Full path: ${dirPath}`)

    const nestedResultsPath = join(dirPath, '.vscode-memory-leak-finder-results')
    const hasNestedResults = existsSync(nestedResultsPath)
    const sourceDir = hasNestedResults ? nestedResultsPath : dirPath

    if (hasNestedResults) {
      logger.log(`   ✓ Found nested .vscode-memory-leak-finder-results directory`)
    } else {
      logger.log(`   ℹ️  No nested .vscode-memory-leak-finder-results directory found`)
    }

    try {
      const result = await mergeDirectoryContents({
        sourceDir,
        targetDir,
        logger,
      })
      logger.log(`   ✓ Copied ${result.copied} of ${result.total} entries to target directory`)
      if (result.skipped > 0) {
        logger.log(`   ⚠️  Skipped ${result.skipped} entries while copying`)
      }
    } catch (error) {
      logger.error(`   ✗ Error copying from ${hasNestedResults ? 'nested' : 'source'} directory:`, error)
    }
  }

  logger.log(`\n📊 Final target directory contents:`)
  try {
    const finalEntries = await readdir(targetDir)
    logger.log(`   Total entries: ${finalEntries.length}`)
    for (const entry of finalEntries) {
      const entryPath = join(targetDir, entry)
      const entryStats = await stat(entryPath)
      const type = entryStats.isDirectory() ? '📁' : '📄'
      logger.log(`   ${type} ${entry}`)
    }
  } catch (error) {
    logger.error(`   ✗ Error reading target directory:`, error)
  }

  logger.log('\n✅ Artifact merge process completed')
}

const main = async (): Promise<void> => {
  try {
    await mergeArtifacts()
  } catch (error) {
    console.error('Error merging artifacts:', (error as Error).message)
    console.error(error)
    process.exit(1)
  }
}

const isEntryPoint = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntryPoint) {
  main()
}
