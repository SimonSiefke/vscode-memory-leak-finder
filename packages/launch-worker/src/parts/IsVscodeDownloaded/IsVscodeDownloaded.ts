import * as DownloadWorker from '../DownloadWorker/DownloadWorker.ts'

export const isVscodeDownloaded = async (
  vscodeVersion: string,
  vscodePath: string,
  commit: string,
  platform: string,
  arch: string,
): Promise<boolean> => {
  // TODO this seems like a lot of extra work, only to check if vscode is downloaded
  const rpc = await DownloadWorker.launch()
  const result = await rpc.invoke('Download.isVscodeDownloaded', vscodeVersion, vscodePath, commit, platform, arch)
  await rpc.dispose()
  return result
}
