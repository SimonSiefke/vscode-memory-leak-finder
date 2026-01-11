import * as CompressVideo from '../CompressVideo/CompressVideo.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'
import * as FinalizeChapters from '../FinalizeChapters/FinalizeChapters.ts'

export const finalize = async () => {
  const ffmpegProcess = FfmpegProcessState.get()
  if (!ffmpegProcess || !ffmpegProcess.stdin) {
    return
  }
  ffmpegProcess.stdin.end()
  await FinalizeChapters.finalizeChapters()
  const compressVideo = FfmpegProcessState.getCompressVideo()
  if (compressVideo) {
    await CompressVideo.compressVideo()
  }
}
