import { VError } from '@lvce-editor/verror'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.ts'

export const downloadFfmpegMaybe = async (platform: string, arch: string): Promise<void> => {
  try {
    await DownloadFfmpeg.downloadFfmpeg(platform, arch)
  } catch (error) {
    console.warn(new VError(error, `Failed to download ffmpeg`))
  }
}
