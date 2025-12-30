import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import * as FindCommitForVersion from '../FindCommitForVersion/FindCommitForVersion.ts'
import * as GetNodeVersion from '../GetNodeVersion/GetNodeVersion.ts'
import * as InstallNodeVersion from '../InstallNodeVersion/InstallNodeVersion.ts'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.ts'
import * as ModifyEsbuildConfig from '../ModifyEsbuildConfig/ModifyEsbuildConfig.ts'
import * as BuildExtension from '../BuildExtension/BuildExtension.ts'
import * as CopySourceMaps from '../CopySourceMaps/CopySourceMaps.ts'
import * as Exec from '../Exec/Exec.ts'
import * as GetDisplayname from '../GetDisplayname/GetDisplayname.ts'

export const generateExtensionSourceMaps = async ({
  extensionName,
  version,
  repoUrl,
  outputDir,
  cacheDir,
}: {
  extensionName: string
  version: string
  repoUrl: string
  outputDir: string
  cacheDir: string
}): Promise<void> => {
  const repoPath = join(cacheDir, `${extensionName}-${version}`)

  // Check if already built
  // Use the same extension ID format as CopySourceMaps (github.extensionName-normalizedVersion)
  const normalizedVersion = version.startsWith('v') ? version.slice(1) : version
  const extensionId = `github.${extensionName}-${normalizedVersion}`
  const sourceMapsOutputPath = join(outputDir, extensionId)
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
  await mkdir(outputDir, { recursive: true })
  await CopySourceMaps.copySourceMaps(repoPath, outputDir, extensionName, version)

  console.log(`[extension-source-maps] Successfully generated source maps for ${extensionName} ${version}`)
}
