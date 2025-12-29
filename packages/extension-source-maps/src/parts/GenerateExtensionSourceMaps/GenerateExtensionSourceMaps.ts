import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import * as FindCommitForVersion from '../FindCommitForVersion/FindCommitForVersion.ts'
import * as GetNodeVersion from '../GetNodeVersion/GetNodeVersion.ts'
import * as InstallNodeVersion from '../InstallNodeVersion/InstallNodeVersion.ts'
import * as ModifyEsbuildConfig from '../ModifyEsbuildConfig/ModifyEsbuildConfig.ts'
import * as BuildExtension from '../BuildExtension/BuildExtension.ts'
import * as CopySourceMaps from '../CopySourceMaps/CopySourceMaps.ts'
import * as Exec from '../Exec/Exec.ts'

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
  const sourceMapsOutputPath = join(outputDir, `${extensionName}-${version}`)
  if (existsSync(sourceMapsOutputPath)) {
    console.log(`Source maps for ${extensionName} ${version} already exist, skipping...`)
    return
  }

  // Clone repository if needed
  if (!existsSync(repoPath)) {
    console.log(`Cloning ${extensionName} repository...`)
    await CloneRepository.cloneRepository(repoUrl, repoPath, 'main')
  }

  // Find commit for version
  console.log(`Finding commit for version ${version}...`)
  const commit = await FindCommitForVersion.findCommitForVersion(repoPath, version)
  console.log(`Found commit: ${commit}`)

  // Checkout the commit
  const checkoutResult = await Exec.exec('git', ['checkout', commit], { cwd: repoPath })
  if (checkoutResult.exitCode !== 0) {
    throw new Error(`Failed to checkout commit ${commit}: ${checkoutResult.stderr}`)
  }

  // Get node version
  console.log(`Getting node version from package.json...`)
  const nodeVersion = await GetNodeVersion.getNodeVersion(repoPath)
  console.log(`Node version: ${nodeVersion}`)

  // Install node version
  console.log(`Installing node version ${nodeVersion}...`)
  await InstallNodeVersion.installNodeVersion(nodeVersion)

  // Modify esbuild config
  console.log(`Modifying esbuild config to generate sourcemaps...`)
  await ModifyEsbuildConfig.modifyEsbuildConfig(repoPath)

  // Build extension
  console.log(`Building extension...`)
  await BuildExtension.buildExtension(repoPath, nodeVersion)

  // Copy source maps
  console.log(`Copying source maps...`)
  await mkdir(outputDir, { recursive: true })
  await CopySourceMaps.copySourceMaps(repoPath, outputDir, extensionName, version)

  // Dispose exec worker
  await Exec.dispose()

  console.log(`Successfully generated source maps for ${extensionName} ${version}`)
}
