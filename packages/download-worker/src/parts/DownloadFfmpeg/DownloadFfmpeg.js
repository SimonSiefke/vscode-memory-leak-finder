import * as DownloadExecutable from '../DownloadExecutable/DownloadExecutable.js'
import * as GetHostPlatform from '../GetHostPlatform/GetHostPlatform.js'

export const downloadFfmpeg = async () => {
  const hostPlatform = await GetHostPlatform.getHostPlatform()
  const name = 'ffmpeg'
  const revision = '1009'
  await DownloadExecutable.downloadExecutable(name, revision, hostPlatform)
}
