import * as DownloadExecutable from '../DownloadExecutable/DownloadExecutable.js'

export const main = async () => {
  const hostPlatform = `ubuntu22.04`
  const name = 'ffmpeg'
  const revision = '1009'
  await DownloadExecutable.downloadExecutable(name, revision, hostPlatform)
}
