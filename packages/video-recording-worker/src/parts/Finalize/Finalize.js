import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'
import * as FinalizeChapters from '../FinalizeChapters/FinalizeChapters.js'

export const finalize = async () => {
  const ffmpegProcess = FfmpegProcessState.get()
  if (!ffmpegProcess || !ffmpegProcess.stdin) {
    return
  }
  ffmpegProcess.stdin.end()
  await FinalizeChapters.finalizeChapters()
}
