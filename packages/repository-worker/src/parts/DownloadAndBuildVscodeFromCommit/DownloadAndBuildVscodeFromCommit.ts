import * as Assert from '../Assert/Assert.ts'
import { dirname } from 'node:path'
import * as CacheNodeModules from '../CacheNodeModules/CacheNodeModules.ts'
import * as CheckoutCommit from '../CheckoutCommit/CheckoutCommit.ts'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import { computeVscodeNodeModulesCacheKey } from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.ts'
import * as SetupNodeModulesFromCache from '../CopyNodeModulesFromCacheToRepositoryFolder/CopyNodeModulesFromCacheToRepositoryFolder.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { fixTypescriptErrors } from '../FixTypescriptErrors/FixTypescriptErrors.ts'
import { hasCompleteTopLevelNodeModules } from '../HasCompleteTopLevelNodeModules/HasCompleteTopLevelNodeModules.ts'
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
  buildVscodeMinified: boolean = false,
  repoFolderName: string = '',
) => {
  Assert.string(commitRef)
  // Assert.string(repoUrl)
  Assert.string(reposDir)
  Assert.string(nodeModulesCacheDir)
  Assert.boolean(useNice)
  Assert.boolean(buildVscodeMinified)
  Assert.string(repoFolderName)
  if (buildVscodeMinified && platform !== 'linux') {
    throw new Error(`--build-vscode-minified is not supported on ${platform}`)
  }

  // Resolve the commit reference to get repository URL and commit hash
  const { commitHash, owner } = await ResolveCommitHash.resolveCommitHash(_repoUrl, commitRef)
  const repoUrl = `https://github.com/${owner}/vscode.git`

  const repoFolder = repoFolderName || (buildVscodeMinified ? `${commitHash}-minified/source` : commitHash)
  const repoPathWithCommitHash = Path.join(reposDir, repoFolder)

  // Create parent directory if it doesn't exist
  const existsReposDir = await FileSystemWorker.pathExists(reposDir)
  const gitPath = Path.join(repoPathWithCommitHash, '.git')
  const existsGitPath = await FileSystemWorker.pathExists(gitPath)

  if (!existsReposDir) {
    await FileSystemWorker.makeDirectory(reposDir)
  }
  const repoParentDir = dirname(repoPathWithCommitHash)
  if (repoParentDir !== reposDir && !(await FileSystemWorker.pathExists(repoParentDir))) {
    await FileSystemWorker.makeDirectory(repoParentDir)
  }

  // For fork commits, ensure the owner directory exists
  if (commitRef.includes('/') && !commitRef.startsWith('http')) {
    const owner = commitRef.split('/', 1)[0]
    const ownerDir = Path.join(reposDir, owner)
    const existsOwnerDir = await FileSystemWorker.pathExists(ownerDir)
    if (!existsOwnerDir) {
      await FileSystemWorker.makeDirectory(ownerDir)
    }
  }

  // Clone the repository if needed
  if (existsGitPath) {
    await CheckoutCommit.checkoutCommit(repoPathWithCommitHash, repoUrl, commitHash)
  } else {
    await CloneRepository.cloneRepository(repoUrl, repoPathWithCommitHash, commitHash)
  }

  // Check what's needed after the repository is at the requested commit
  const mainJsPath = Path.join(repoPathWithCommitHash, 'out', 'main.js')
  const minifiedExecutablePath = Path.join(dirname(repoPathWithCommitHash), `VSCode-${platform}-${arch}`, 'code-oss')
  const nodeModulesPath = Path.join(repoPathWithCommitHash, 'node_modules')
  const nodeModulesPackageLock = Path.join(repoPathWithCommitHash, 'node_modules', '.package-lock.json')
  const outPath = Path.join(repoPathWithCommitHash, 'out')
  const existsMainJsPath = await FileSystemWorker.pathExists(mainJsPath)
  const existsMinifiedExecutablePath = buildVscodeMinified ? await FileSystemWorker.pathExists(minifiedExecutablePath) : false
  const existsNodeModulesPath = await FileSystemWorker.pathExists(nodeModulesPath)
  const existsNodeModulesLockPath = await FileSystemWorker.pathExists(nodeModulesPackageLock)
  const existsOutPath = await FileSystemWorker.pathExists(outPath)
  const hasValidNodeModules =
    existsNodeModulesPath && existsNodeModulesLockPath && (await hasCompleteTopLevelNodeModules(repoPathWithCommitHash))

  const needsInstall = (buildVscodeMinified ? !existsMinifiedExecutablePath : !existsMainJsPath) && !hasValidNodeModules
  const needsCompile = buildVscodeMinified ? !existsMinifiedExecutablePath : !existsMainJsPath && !existsOutPath

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
    if (nodeModulesCacheDir) {
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
    } else {
      await InstallDependencies.installDependencies(repoPathWithCommitHash, useNice)
    }
  } else if (!existsMainJsPath) {
    Logger.log(`[repository] node_modules already exists in repo for commit ${commitHash}, skipping npm ci...`)
  }

  // Compile if needed
  if (needsCompile) {
    await InstallDependencies.ensureNestedDependencies(repoPathWithCommitHash, useNice)
    await fixTypescriptErrors(repoPathWithCommitHash)
    if (buildVscodeMinified) {
      Logger.log(`[repository] Building minified VS Code for commit ${commitHash}...`)
      await RunCompile.runMinifiedBuild(repoPathWithCommitHash, platform, arch, useNice, minifiedExecutablePath)
    } else {
      Logger.log(`[repository] Compiling VS Code for commit ${commitHash}...`)
      await RunCompile.runCompile(repoPathWithCommitHash, useNice, mainJsPath)
    }
  }

  // TODO support windows
  // Return the path to the built VS Code binary
  if (buildVscodeMinified) {
    return minifiedExecutablePath
  }
  const codeScriptPath = Path.join(repoPathWithCommitHash, 'scripts', 'code.sh')
  return codeScriptPath
}
