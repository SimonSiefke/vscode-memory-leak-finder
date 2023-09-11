import { VError } from '@lvce-editor/verror'
import * as DownloadFfmpeg from '../DownloadFfmpeg/DownloadFfmpeg.js'

const main = async () => {
  try {
    await DownloadFfmpeg.downloadFfmpeg()
  } catch (error) {
    console.warn(new VError(error, `Failed to download ffmpeg`))
  }
}

main()
