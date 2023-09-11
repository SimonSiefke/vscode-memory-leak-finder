import * as Ffmpeg from '../Ffmpeg/Ffmpeg.js'

export const start = async (outFile) => {
  await Ffmpeg.start(outFile)
}
