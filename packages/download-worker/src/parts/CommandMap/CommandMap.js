import * as DownloadAndUnzipCursor from '../DownloadAndUnzipCursor/DownloadAndUnzipCursor.js'
import * as DownloadAndUnzipVscode from '../DownloadAndUnzipVscode/DownloadAndUnzipVscode.js'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.js'

export const commandMap = {
  'Download.downloadAndUnzipVscode': DownloadAndUnzipVscode.downloadAndUnzipVscode,
  'Download.downloadFfmpeg': DownloadFfmpeg.downloadFfmpeg,
  'Download.downloadAndUnzipCursor': DownloadAndUnzipCursor.downloadAndUnzipCursor,
}
