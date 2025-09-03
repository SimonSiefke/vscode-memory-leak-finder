import * as Assert from '../Assert/Assert.ts'
import * as CacheNodeModules from '../CacheNodeModules/CacheNodeModules.ts'
import * as CloneRepository from '../CloneRepository/CloneRepository.ts'
import { computeVscodeNodeModulesCacheKey } from '../ComputeVscodeNodeModulesCacheKey/ComputeVscodeNodeModulesCacheKey.ts'
import * as SetupNodeModulesFromCache from '../CopyNodeModulesFromCacheToRepositoryFolder/CopyNodeModulesFromCacheToRepositoryFolder.ts'
import * as FileSystemWorker from '../FileSystemWorker/FileSystemWorker.ts'
import { fixTypescriptErrors } from '../FixTypescriptErrors/FixTypescriptErrors.ts'
import * as InstallDependencies from '../InstallDependencies/InstallDependencies.ts'
import * as Logger from '../Logger/Logger.ts'
import * as Path from '../Path/Path.ts'
import { preCacheRipgrep } from '../PreCacheRipgrep/PreCacheRipgrep.ts'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.ts'
import * as RunCompile from '../RunCompile/RunCompile.ts'

export const downloadAndBuildVscodeFromCommit = async (
  commitRef: string,
  repoUrl: string,
  reposDir: string,
  nodeModulesCacheDir: string,
  useNice: boolean,
) => {
  Assert.string(commitRef)
  Assert.string(repoUrl)
  Assert.string(reposDir)
  Assert.string(nodeModulesCacheDir)
  Assert.boolean(useNice)
  // Resolve the commit reference to an actual commit hash
  const commitHash = await ResolveCommitHash.resolveCommitHash(repoUrl, commitRef)
  const repoPathWithCommitHash = Path.join(reposDir, commitHash)

  // Create parent directory if it doesn't exist
  const existsReposDir = await FileSystemWorker.pathExists(reposDir)

  // Check what's needed at the start
  const mainJsPath = Path.join(repoPathWithCommitHash, 'out', 'main.ts')
  const nodeModulesPath = Path.join(repoPathWithCommitHash, 'node_modules')
  const outPath = Path.join(repoPathWithCommitHash, 'out')

  const existsRepoPath = await FileSystemWorker.pathExists(repoPathWithCommitHash)
  const existsMainJsPath = await FileSystemWorker.pathExists(mainJsPath)
  const existsNodeModulesPath = await FileSystemWorker.pathExists(nodeModulesPath)
  const existsOutPath = await FileSystemWorker.pathExists(outPath)

  const needsClone = !existsRepoPath
  const needsInstall = !existsMainJsPath && !existsNodeModulesPath
  const needsCompile = !existsMainJsPath && !existsOutPath

  if (!existsReposDir) {
    await FileSystemWorker.makeDirectory(reposDir)
  }

  // Clone the repository if needed
  if (needsClone) {
    await CloneRepository.cloneRepository(repoUrl, repoPathWithCommitHash, commitHash)
  }

  // Pre-cache ripgrep binary after cloning but before installing dependencies
  // This avoids GitHub API 403 errors during npm ci
  if (needsInstall) {
    Logger.log(`[repository] Pre-caching ripgrep binary before installing dependencies...`)
    try {
      await preCacheRipgrep()
    } catch (error) {
      Logger.log(`[repository] Warning: Failed to pre-cache ripgrep: ${error}`)
      Logger.log(`[repository] Continuing with npm ci - may encounter GitHub API issues`)
    }
  }

  if (needsInstall) {
    Logger.log(`[repository] Installing dependencies for commit ${commitHash}...`)
    const nodeModulesHash = await computeVscodeNodeModulesCacheKey(repoPathWithCommitHash)
    const cacheExists = await FileSystemWorker.pathExists(Path.join(nodeModulesCacheDir, nodeModulesHash))
    if (cacheExists) {
      await SetupNodeModulesFromCache.copyNodeModulesFromCacheToRepositoryFolder(
        Path.join(nodeModulesCacheDir, nodeModulesHash),
        repoPathWithCommitHash,
      )
    } else {
      await InstallDependencies.installDependencies(repoPathWithCommitHash, useNice)
      // const toRemove=['test/mcp/node_modules/npm-run-all/node_modules/which/bin/which']
      // for(const item of toRemove){
      //   await rm(join(
      //     repoPathWithCommitHash, item
      //   ), {force:true})
      // }
      await CacheNodeModules.moveNodeModulesToCache(repoPathWithCommitHash, commitHash, nodeModulesCacheDir, nodeModulesHash)
    }
  } else if (!existsMainJsPath) {
    Logger.log(`[repository] node_modules already exists in repo for commit ${commitHash}, skipping npm ci...`)
  }

  // Compile if needed
  if (needsCompile) {
    await fixTypescriptErrors(repoPathWithCommitHash)
    Logger.log(`[repository] Compiling VS Code for commit ${commitHash}...`)
    await RunCompile.runCompile(repoPathWithCommitHash, useNice, mainJsPath)
  }

  // TODO support windows
  // Return the path to the built VS Code binary
  const codeScriptPath = Path.join(repoPathWithCommitHash, 'scripts', 'code.sh')
  return codeScriptPath
}
