import * as DownloadExecutable from '../DownloadExecutable/DownloadExecutable.js'
import * as GetHostPlatform from '../GetHostPlatform/GetHostPlatform.js'
import * as IsFfmpeg from '../IsFfmpeg/IsFfmpeg.js'
import * as Registry from '../Registry/Registry.js'
import * as GetExecutablePath from '../GetExecutablePath/GetExecutablePath.js'

export const downloadFfmpeg = async () => {
  const platform = process.platform
  const hostPlatform = await GetHostPlatform.getHostPlatform(platform)
  const browsers = Registry.load()
  const ffmpeg = browsers.find(IsFfmpeg.isFfmpeg)
  if (!ffmpeg) {
    throw new Error(`no ffmpeg configuration found`)
  }
  const executablePath = GetExecutablePath.getExecutablePath(ffmpeg.name)
  await DownloadExecutable.downloadExecutable(ffmpeg.name, ffmpeg.revision, hostPlatform, executablePath)
}
