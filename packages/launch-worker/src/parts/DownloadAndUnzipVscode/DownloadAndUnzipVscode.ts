import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

export interface DownloadAndUnzipVscodeOptions {
  readonly arch: string
  readonly insidersCommit: string
  readonly platform: string
  readonly updateUrl: string
  readonly vscodeVersion: string
}

export const downloadAndUnzipVscode = async (options: DownloadAndUnzipVscodeOptions) => {
  const rpc = await DownloadWorker.launch()
  const path = await rpc.invoke('Download.downloadAndUnzipVscode', options)
  await rpc.dispose()
  return path
}
