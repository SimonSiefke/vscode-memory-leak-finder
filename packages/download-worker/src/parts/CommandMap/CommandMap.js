import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.js'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js'
import * as DownloadAndBuildVscodeFromCommit from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.js'
import * as DownloadFfmpegMaybe from '../DownloadFfmpegMaybe/DownloadFfmpegMaybe.js'
import * as VscodeNodeModulesCache from '../VscodeNodeModulesCache/VscodeNodeModulesCache.js'
import * as ResolveCommitHash from '../ResolveCommitHash/ResolveCommitHash.js'

export const commandMap = {
  'Download.downloadAndUnzipCursor': DownloadAndUnzipCursor.downloadAndUnzipCursor,
  'Download.downloadAndUnzipVscode': DownloadAndUnzipVscode.downloadAndUnzipVscode,
  'Download.downloadAndBuildVscodeFromCommit': DownloadAndBuildVscodeFromCommit.downloadAndBuildVscodeFromCommit,
  'Download.downloadFfmpeg': DownloadFfmpeg.downloadFfmpeg,
  'Download.downloadFfmpegMaybe': DownloadFfmpegMaybe.downloadFfmpegMaybe,
  'VscodeNodeModulesCache.setupNodeModulesFromCache': VscodeNodeModulesCache.setupNodeModulesFromCache,
  'VscodeNodeModulesCache.cacheNodeModules': VscodeNodeModulesCache.cacheNodeModules,
  'VscodeNodeModulesCache.cleanupNodeModules': VscodeNodeModulesCache.cleanupNodeModules,
  'ResolveCommitHash.resolveCommitHash': ResolveCommitHash.resolveCommitHash,
}
