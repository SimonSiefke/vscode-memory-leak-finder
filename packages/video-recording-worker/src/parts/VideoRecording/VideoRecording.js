import * as Ffmpeg from '../Ffmpeg/Ffmpeg.js'
import * as Assert from '../Assert/Assert.js'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'

export const start = async (outFile) => {
  Assert.string(outFile)
  await Ffmpeg.start(outFile)
  FfmpegProcessState.setOutFile(outFile)
}
