import * as Assert from '../Assert/Assert.ts'
import * as Ffmpeg from '../Ffmpeg/Ffmpeg.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'

export const start = async (outFile: string): Promise<void> => {
  Assert.string(outFile)
  await Ffmpeg.start(outFile)
  FfmpegProcessState.setOutFile(outFile)
}
