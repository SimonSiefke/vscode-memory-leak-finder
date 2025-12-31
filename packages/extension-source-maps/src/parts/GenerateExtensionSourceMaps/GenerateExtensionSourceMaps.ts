import { existsSync } from 'node:fs'
import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import * as BuildExtension from '../BuildExtension/BuildExtension.ts'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import * as Exec from '../Exec/Exec.ts'
import * as FindCommitForVersion from '../FindCommitForVersion/FindCommitForVersion.ts'
import * as GetDisplayname from '../GetDisplayname/GetDisplayname.ts'
import * as GetNodeVersion from '../GetNodeVersion/GetNodeVersion.ts'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.ts'
import * as InstallNodeVersion from '../InstallNodeVersion/InstallNodeVersion.ts'
import * as ModifyEsbuildConfig from '../ModifyEsbuildConfig/ModifyEsbuildConfig.ts'
import type { SourceMapFile } from '../SourceMapFile/SourceMapFile.js'

export const generateExtensionSourceMaps = async ({
  cacheDir,
  extensionName,
  repoUrl,
  version,
}: {
  extensionName: string
  version: string
  repoUrl: string
  cacheDir: string
}): Promise<void> => {
  const repoPath = join(cacheDir, `${extensionName}-${version}`)

  // Check if already built
  // Normalize version by stripping 'v' prefix if present
  const normalizedVersion = version.startsWith('v') ? version.slice(1) : version
  const extensionId = `${extensionName}-${normalizedVersion}`
  const sourceMapsOutputPath = join(cacheDir, extensionId)
  if (existsSync(sourceMapsOutputPath)) {
    const displayName = GetDisplayname.getDisplayname(extensionName)
    console.log(`[extension-source-maps] Source maps for ${displayName} ${version} already exist, skipping...`)
    return
  }

  // Clone repository if needed
  if (!existsSync(repoPath)) {
    console.log(`[extension-source-maps] Cloning ${extensionName} repository...`)
    await CloneRepository.cloneRepository(repoUrl, repoPath, 'main')
  }

  // Fetch all tags so we can resolve versions to commits
  console.log(`[extension-source-maps] Fetching all tags...`)
  try {
    await Exec.exec('git', ['fetch', 'origin', '--tags'], { cwd: repoPath })
  } catch {
    // If fetch fails, continue anyway - tags might already be available
  }

  // Find commit for version
  console.log(`[extension-source-maps] Finding commit for version ${version}...`)
  const commit = await FindCommitForVersion.findCommitForVersion(repoPath, version)
  console.log(`[extension-source-maps] Found commit: ${commit}`)

  // Checkout the commit
  const checkoutResult = await Exec.exec('git', ['checkout', commit], { cwd: repoPath })
  if (checkoutResult.exitCode !== 0) {
    throw new Error(`Failed to checkout commit ${commit}: ${checkoutResult.stderr}`)
  }

  // Get node version
  const nodeVersion = await GetNodeVersion.getNodeVersion(repoPath)
  console.log(`[extension-source-maps] Getting node version from package.json: ${nodeVersion}`)

  // Install node version
  console.log(`[extension-source-maps] Installing node version ${nodeVersion}...`)
  await InstallNodeVersion.installNodeVersion(nodeVersion)
  console.log(`[extension-source-maps] Node version ${nodeVersion} installed successfully`)

  // Install dependencies
  console.log(`[extension-source-maps] Installing dependencies...`)
  await InstallDependencies.installDependencies(repoPath, nodeVersion)
  console.log(`[extension-source-maps] Dependencies installed successfully`)

  // Modify esbuild config
  console.log(`[extension-source-maps] Modifying esbuild config to generate sourcemaps...`)
  await ModifyEsbuildConfig.modifyEsbuildConfig(repoPath)

  // Build extension
  console.log(`[extension-source-maps] Building extension...`)
  await BuildExtension.buildExtension(repoPath, nodeVersion)

  // Copy source maps
  console.log(`[extension-source-maps] Copying source maps...`)
  await mkdir(cacheDir, { recursive: true })

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
  const extensionOutputDir = join(cacheDir, extensionId)

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

  console.log(`[extension-source-maps] Successfully generated source maps for ${extensionName} ${version}`)
}
