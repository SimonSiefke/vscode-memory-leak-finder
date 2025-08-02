import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.js'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.js'
import * as DownloadFfmpegMaybe from '../DownloadFfmpegMaybe/DownloadFfmpegMaybe.js'
import { setupNodeModulesFromCache } from '../SetupNodeModulesFromCache/SetupNodeModulesFromCache.js'
import { cacheNodeModules } from '../CacheNodeModules/CacheNodeModules.js'
import { cleanupNodeModules } from '../CleanupNodeModules/CleanupNodeModules.js'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'

export const commandMap = {
  'Download.downloadAndUnzipCursor': DownloadAndUnzipCursor.downloadAndUnzipCursor,
  'Download.downloadAndUnzipVscode': DownloadAndUnzipVscode.downloadAndUnzipVscode,
  'Download.downloadAndBuildVscodeFromCommit': DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit,
  'Download.downloadFfmpeg': DownloadFfmpeg.downloadFfmpeg,
  'Download.downloadFfmpegMaybe': DownloadFfmpegMaybe.downloadFfmpegMaybe,
  'VscodeNodeModulesCache.setupNodeModulesFromCache': setupNodeModulesFromCache,
  'VscodeNodeModulesCache.cacheNodeModules': cacheNodeModules,
  'VscodeNodeModulesCache.cleanupNodeModules': cleanupNodeModules,
  'ResolveCommitHash.resolveCommitHash': ResolveCommitHash.resolveCommitHash,
}
