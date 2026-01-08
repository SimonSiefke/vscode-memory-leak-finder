import * as Assert from '../Assert/Assert.ts'
import * as Ffmpeg from '../Ffmpeg/Ffmpeg.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'

export const start = async (platform: string, outFile: string, compressVideo: boolean): Promise<void> => {
  Assert.string(outFile)
  await Ffmpeg.start(platform, outFile)
  FfmpegProcessState.setOutFile(outFile)
  FfmpegProcessState.setCompressVideo(compressVideo)
}
