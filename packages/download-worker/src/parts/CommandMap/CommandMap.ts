import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.ts'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.ts'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.ts'
import * as DownloadFfmpegMaybe from '../DownloadFfmpegMaybe/DownloadFfmpegMaybe.ts'

export const commandMap: Record<string, (...args: any[]) => any> = {
  'Download.downloadAndUnzipCursor': DownloadAndUnzipCursor.downloadAndUnzipCursor,
  'Download.downloadAndUnzipVscode': DownloadAndUnzipVscode.downloadAndUnzipVscode,
  'Download.downloadFfmpeg': DownloadFfmpeg.downloadFfmpeg,
  'Download.downloadFfmpegMaybe': DownloadFfmpegMaybe.downloadFfmpegMaybe,
}
