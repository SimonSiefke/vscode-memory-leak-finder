import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'
import * as FinalizeChapters from '../FinalizeChapters/FinalizeChapters.ts'
import * as TestEventTracker from '../TestEventTracker/TestEventTracker.ts'
import * as VideoPostProcessing from '../VideoPostProcessing/VideoPostProcessing.ts'

export const finalize = async () => {
  const ffmpegProcess = FfmpegProcessState.get()
  if (!ffmpegProcess || !ffmpegProcess.stdin) {
    return
  }
  ffmpegProcess.stdin.end()
  await FinalizeChapters.finalizeChapters()

  // Add test status banner to the video
  const outFile = FfmpegProcessState.getOutFile()
  const testEvents = TestEventTracker.getTestEvents()

  if (testEvents.length > 0) {
    const tempFile = outFile.replace('.webm', '_temp.webm')
    const finalFile = outFile.replace('.webm', '_with_banner.webm')

    try {
      await VideoPostProcessing.addTestStatusBanner(outFile, tempFile, testEvents)
      // Replace the original file with the processed version
      const fs = await import('fs/promises')
      await fs.rename(tempFile, finalFile)
      console.log(`Video with test status banner saved to: ${finalFile}`)
    } catch (error) {
      console.log('Failed to add test status banner:', error)
    }
  }
}
