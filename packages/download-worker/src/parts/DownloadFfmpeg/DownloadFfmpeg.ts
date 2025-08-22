import * as DownloadExecutable from '../DownloadExecutable/DownloadExecutable.ts'
import * as GetExecutablePath from '../GetExecutablePath/GetExecutablePath.ts'
import * as GetHostPlatform from '../GetHostPlatform/GetHostPlatform.ts'
import * as IsFfmpeg from '../IsFfmpeg/IsFfmpeg.ts'
import * as Registry from '../Registry/Registry.ts'

export const downloadFfmpeg = async (): Promise<void> => {
  const { platform } = process
  const hostPlatform = await GetHostPlatform.getHostPlatform(platform)
  const browsers = Registry.load()
  const ffmpeg = browsers.find(IsFfmpeg.isFfmpeg)
  if (!ffmpeg) {
    throw new Error(`no ffmpeg configuration found`)
  }
  const executablePath = GetExecutablePath.getExecutablePath(ffmpeg.name)
  await DownloadExecutable.downloadExecutable(ffmpeg.name, ffmpeg.revision, hostPlatform, executablePath)
}
