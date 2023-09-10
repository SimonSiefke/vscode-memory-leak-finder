import * as DownloadExecutable from '../DownloadExecutable/DownloadExecutable.js'
import * as GetHostPlatform from '../GetHostPlatform/GetHostPlatform.js'
import * as IsFfmpeg from '../IsFfmpeg/IsFfmpeg.js'
import * as Registry from '../Registry/Registry.js'

export const downloadFfmpeg = async () => {
  const hostPlatform = await GetHostPlatform.getHostPlatform()
  const browsers = Registry.load()
  const ffmpeg = browsers.find(IsFfmpeg.isFfmpeg)
  if (!ffmpeg) {
    throw new Error(`no ffmpeg configuration found`)
  }
  await DownloadExecutable.downloadExecutable(ffmpeg.name, ffmpeg.revision, hostPlatform)
}
