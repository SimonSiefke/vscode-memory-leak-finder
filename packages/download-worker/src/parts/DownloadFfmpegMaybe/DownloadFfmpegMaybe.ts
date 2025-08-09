import { VError } from '@lvce-editor/verror'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.ts'

export const downloadFfmpegMaybe = async (): Promise<void> => {
  try {
    await DownloadFfmpeg.downloadFfmpeg()
  } catch (error) {
    console.warn(new VError(error, `Failed to download ffmpeg`))
  }
}
