import * as Assert from '../Assert/Assert.ts'
import * as CacheNodeModules from '../CacheNodeModules/CacheNodeModules.ts'
import * as CheckoutCommit from '../CheckoutCommit/CheckoutCommit.ts'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import { computeVscodeNodeModulesCacheKey } from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.ts'
import * as SetupNodeModulesFromCache from '../CopyNodeModulesFromCacheToRepositoryFolder/CopyNodeModulesFromCacheToRepositoryFolder.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { hasCompleteTopLevelNodeModules } from '../HasCompleteTopLevelNodeModules/HasCompleteTopLevelNodeModules.ts'
import { fixTypescriptErrors } from '../FixTypescriptErrors/FixTypescriptErrors.ts'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Path from '../Path/Path.ts'
import { preCacheRipgrep } from '../PreCacheRipgrep/PreCacheRipgrep.ts'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.ts'
import * as RunCompile from '../RunCompile/RunCompile.ts'

export const downloadAndBuildVscodeFromCommit = async (
  platform: string,
  arch: string,
  commitRef: string,
  _repoUrl: string,
  reposDir: string,
  nodeModulesCacheDir: string,
  useNice: boolean,
  repoFolderName: string = '',
) => {
  Assert.string(commitRef)
  // Assert.string(repoUrl)
  Assert.string(reposDir)
  Assert.string(nodeModulesCacheDir)
  Assert.boolean(useNice)
  Assert.string(repoFolderName)

  // Resolve the commit reference to get repository URL and commit hash
  const { commitHash, owner } = await ResolveCommitHash.resolveCommitHash(_repoUrl, commitRef)
  const repoUrl = `https://github.com/${owner}/vscode.git`

  const repoFolder = repoFolderName || commitHash
  const repoPathWithCommitHash = Path.join(reposDir, repoFolder)

  // Create parent directory if it doesn't exist
  const existsReposDir = await FileSystemWorker.pathExists(reposDir)
  const gitPath = Path.join(repoPathWithCommitHash, '.git')
  const existsGitPath = await FileSystemWorker.pathExists(gitPath)

  if (!existsReposDir) {
    await FileSystemWorker.makeDirectory(reposDir)
  }

  // For fork commits, ensure the owner directory exists
  if (commitRef.includes('/') && !commitRef.startsWith('http')) {
    const owner = commitRef.split('/')[0]
    const ownerDir = Path.join(reposDir, owner)
    const existsOwnerDir = await FileSystemWorker.pathExists(ownerDir)
    if (!existsOwnerDir) {
      await FileSystemWorker.makeDirectory(ownerDir)
    }
  }

  // Clone the repository if needed
  if (!existsGitPath) {
    await CloneRepository.cloneRepository(repoUrl, repoPathWithCommitHash, commitHash)
  } else {
    await CheckoutCommit.checkoutCommit(repoPathWithCommitHash, repoUrl, commitHash)
  }

  // Check what's needed after the repository is at the requested commit
  const mainJsPath = Path.join(repoPathWithCommitHash, 'out', 'main.js')
  const nodeModulesPath = Path.join(repoPathWithCommitHash, 'node_modules')
  const nodeModulesPackageLock = Path.join(repoPathWithCommitHash, 'node_modules', '.package-lock.json')
  const outPath = Path.join(repoPathWithCommitHash, 'out')
  const existsMainJsPath = await FileSystemWorker.pathExists(mainJsPath)
  const existsNodeModulesPath = await FileSystemWorker.pathExists(nodeModulesPath)
  const existsNodeModulesLockPath = await FileSystemWorker.pathExists(nodeModulesPackageLock)
  const existsOutPath = await FileSystemWorker.pathExists(outPath)
  const hasValidNodeModules =
    existsNodeModulesPath && existsNodeModulesLockPath && (await hasCompleteTopLevelNodeModules(repoPathWithCommitHash))

  const needsInstall = !existsMainJsPath && !hasValidNodeModules
  const needsCompile = !existsMainJsPath && !existsOutPath

  // Pre-cache ripgrep binary after cloning but before installing dependencies
  // This avoids GitHub API 403 errors during npm ci
  if (needsInstall) {
    Logger.log(`[repository] Pre-caching ripgrep binary before installing dependencies...`)
    try {
      await preCacheRipgrep(platform, arch)
    } catch (error) {
      Logger.log(`[repository] Warning: Failed to pre-cache ripgrep: ${error}`)
      Logger.log(`[repository] Continuing with npm ci - may encounter GitHub API issues`)
    }
  }

  if (needsInstall) {
    if (existsNodeModulesPath && !hasValidNodeModules) {
      Logger.log(`[repository] node_modules cache for commit ${commitHash} is incomplete, running npm ci...`)
    }
    Logger.log(`[repository] Installing dependencies for commit ${commitHash}...`)
    if (!nodeModulesCacheDir) {
      await InstallDependencies.installDependencies(repoPathWithCommitHash, useNice)
    } else {
      const nodeModulesHash = await computeVscodeNodeModulesCacheKey(repoPathWithCommitHash)
      const cacheExists = await FileSystemWorker.pathExists(Path.join(nodeModulesCacheDir, nodeModulesHash))
      if (cacheExists) {
        await SetupNodeModulesFromCache.copyNodeModulesFromCacheToRepositoryFolder(
          Path.join(nodeModulesCacheDir, nodeModulesHash),
          repoPathWithCommitHash,
        )
        await InstallDependencies.ensureNestedDependencies(repoPathWithCommitHash, useNice)
      } else {
        await InstallDependencies.installDependencies(repoPathWithCommitHash, useNice)
        await CacheNodeModules.moveNodeModulesToCache(repoPathWithCommitHash, commitHash, nodeModulesCacheDir, nodeModulesHash)
      }
    }
  } else if (!existsMainJsPath) {
    Logger.log(`[repository] node_modules already exists in repo for commit ${commitHash}, skipping npm ci...`)
  }

  // Compile if needed
  if (needsCompile) {
    await InstallDependencies.ensureNestedDependencies(repoPathWithCommitHash, useNice)
    await fixTypescriptErrors(repoPathWithCommitHash)
    Logger.log(`[repository] Compiling VS Code for commit ${commitHash}...`)
    await RunCompile.runCompile(repoPathWithCommitHash, useNice, mainJsPath)
  }

  // TODO support windows
  // Return the path to the built VS Code binary
  const codeScriptPath = Path.join(repoPathWithCommitHash, 'scripts', 'code.sh')
  return codeScriptPath
}
