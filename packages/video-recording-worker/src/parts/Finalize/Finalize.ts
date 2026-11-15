import { once } from 'node:events'
import * as CompressVideo from '../CompressVideo/CompressVideo.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'
import * as FinalizeChapters from '../FinalizeChapters/FinalizeChapters.ts'

export const finalize = async () => {
  const ffmpegProcess = FfmpegProcessState.get()
  if (!ffmpegProcess || !ffmpegProcess.stdin) {
    return
  }
  // Wait until the encoder releases its output before adding chapters,
  // compressing, or letting the coordinator archive a recording on Windows.
  if (ffmpegProcess.exitCode === null && ffmpegProcess.signalCode === null) {
    const closed = once(ffmpegProcess, 'close')
    ffmpegProcess.stdin.end()
    await closed
  }
  await FinalizeChapters.finalizeChapters()
  const compressVideo = FfmpegProcessState.getCompressVideo()
  if (compressVideo) {
    await CompressVideo.compressVideo()
  }
}
