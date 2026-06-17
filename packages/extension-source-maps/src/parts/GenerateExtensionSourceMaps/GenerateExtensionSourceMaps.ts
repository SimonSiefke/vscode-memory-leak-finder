import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as BuildExtension from '../BuildExtension/BuildExtension.ts'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import * as Exec from '../Exec/Exec.ts'
import * as FindCommitForVersion from '../FindCommitForVersion/FindCommitForVersion.ts'
import * as GetNodeVersion from '../GetNodeVersion/GetNodeVersion.ts'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.ts'
import * as InstallNodeVersion from '../InstallNodeVersion/InstallNodeVersion.ts'

export const generateExtensionSourceMaps = async ({
  cacheDir,
  extensionName,
  repoUrl,
  version,
  buildScript,
  platform,
  modifications,
}: {
  extensionName: string
  version: string
  repoUrl: string
  cacheDir: string
  platform: string
  buildScript: readonly string[]
  modifications: readonly any[]
}): Promise<void> => {
  // Check if already built
  // Normalize version by stripping 'v' prefix if present
  const normalizedVersion = version.startsWith('v') ? version.slice(1) : version
  const repoPath = join(cacheDir, `${extensionName}-${normalizedVersion}`)
  const extensionId = `${extensionName}-${normalizedVersion}`
  const sourceMapsOutputPath = join(cacheDir, extensionId)
  if (existsSync(sourceMapsOutputPath)) {
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
  console.log(`[extension-source-maps] Using node version: ${nodeVersion}`)

  // Install node version
  console.log(`[extension-source-maps] Installing node version ${nodeVersion}...`)
  await InstallNodeVersion.installNodeVersion(nodeVersion)
  console.log(`[extension-source-maps] Node version ${nodeVersion} installed successfully`)

  // Install dependencies
  console.log(`[extension-source-maps] Installing dependencies...`)
  await InstallDependencies.installDependencies(repoPath, nodeVersion)
  console.log(`[extension-source-maps] Dependencies installed successfully`)

  // Modify esbuild config
  if (modifications && modifications.length > 0) {
    // TODO
  }

  // Build extension
  console.log(`[extension-source-maps] Building extension...`)
  await BuildExtension.buildExtension(repoPath, nodeVersion, platform, buildScript)

  console.log(`[extension-source-maps] Successfully generated source maps for ${extensionName} ${version}`)
}
