import { readdir, stat, mkdir, cp } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

const root = join(import.meta.dirname, '../../..')
const targetDir = join(root, '.vscode-memory-leak-finder-results')
const pattern = 'vscode-memory-leak-finder-results-linux-'

const mergeArtifacts = async (): Promise<void> => {
  console.log('Starting artifact merge process...')
  console.log(`Root directory: ${root}`)
  console.log(`Target directory: ${targetDir}`)
  console.log(`Pattern to match: ${pattern}*`)

  // Ensure target directory exists
  await mkdir(targetDir, { recursive: true })
  console.log(`✓ Created/verified target directory: ${targetDir}`)

  // Read all entries in the root directory
  const entries = await readdir(root)
  console.log(`\nFound ${entries.length} entries in root directory`)

  // Filter directories matching the pattern
  const matchingDirs: string[] = []
  for (const entry of entries) {
    if (entry.startsWith(pattern)) {
      const entryPath = join(root, entry)
      const stats = await stat(entryPath)
      if (stats.isDirectory()) {
        matchingDirs.push(entry)
      }
    }
  }

  console.log(`\nFound ${matchingDirs.length} directories matching pattern:`)
  for (const dir of matchingDirs) {
    console.log(`  - ${dir}`)
  }

  if (matchingDirs.length === 0) {
    console.log('\n⚠️  No matching directories found. Nothing to merge.')
    return
  }

  // Process each directory
  for (const dir of matchingDirs) {
    const dirPath = join(root, dir)
    console.log(`\n📁 Processing directory: ${dir}`)
    console.log(`   Full path: ${dirPath}`)

    const nestedResultsPath = join(dirPath, '.vscode-memory-leak-finder-results')
    const hasNestedResults = existsSync(nestedResultsPath)

    if (hasNestedResults) {
      console.log(`   ✓ Found nested .vscode-memory-leak-finder-results directory`)
      try {
        const nestedEntries = await readdir(nestedResultsPath)
        console.log(`   ✓ Found ${nestedEntries.length} entries in nested directory`)
        await cp(nestedResultsPath, targetDir, {
          recursive: true,
          force: true,
        })
        console.log(`   ✓ Copied ${nestedEntries.length} entries to target directory`)
      } catch (error) {
        console.error(`   ✗ Error copying from nested directory:`, error)
      }
    } else {
      console.log(`   ℹ️  No nested .vscode-memory-leak-finder-results directory found`)
      try {
        const directEntries = await readdir(dirPath)
        console.log(`   ✓ Found ${directEntries.length} entries directly in directory`)
        // Copy each entry individually to avoid copying the directory itself
        for (const entry of directEntries) {
          const sourcePath = join(dirPath, entry)
          const targetPath = join(targetDir, entry)
          const entryStats = await stat(sourcePath)
          if (entryStats.isDirectory()) {
            await cp(sourcePath, targetPath, { recursive: true, force: true })
          } else {
            await cp(sourcePath, targetPath, { force: true })
          }
        }
        console.log(`   ✓ Copied ${directEntries.length} entries to target directory`)
      } catch (error) {
        console.error(`   ✗ Error copying from directory:`, error)
      }
    }
  }

  // List final contents of target directory
  console.log(`\n📊 Final target directory contents:`)
  try {
    const finalEntries = await readdir(targetDir)
    console.log(`   Total entries: ${finalEntries.length}`)
    for (const entry of finalEntries) {
      const entryPath = join(targetDir, entry)
      const entryStats = await stat(entryPath)
      const type = entryStats.isDirectory() ? '📁' : '📄'
      console.log(`   ${type} ${entry}`)
    }
  } catch (error) {
    console.error(`   ✗ Error reading target directory:`, error)
  }

  console.log('\n✅ Artifact merge process completed')
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

main()