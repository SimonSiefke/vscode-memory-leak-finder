import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.ts'
import * as Finalize from '../Finalize/Finalize.ts'
import * as Initialize from '../Initialize/Initialize.ts'
import * as VideoChapter from '../VideoChapter/VideoChapter.ts'
import * as VideoRecording from '../VideoRecording/VideoRecording.ts'
import * as VideoWorkerCommandType from '../VideoWorkerCommandType/VideoWorkerCommandType.ts'

export const commandMap = {
  [VideoWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [VideoWorkerCommandType.Initialize]: Initialize.initialize,
  [VideoWorkerCommandType.VideoRecordingAddChapter]: VideoChapter.addChapter,
  [VideoWorkerCommandType.VideoRecordingFinalize]: Finalize.finalize,
  [VideoWorkerCommandType.VideoRecordingStart]: VideoRecording.start,
}
