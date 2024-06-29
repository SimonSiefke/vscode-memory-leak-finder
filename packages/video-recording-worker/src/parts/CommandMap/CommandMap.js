import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as Finalize from '../Finalize/Finalize.js'
import * as VideoChapter from '../VideoChapter/VideoChapter.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'
import * as VideoWorkerCommandType from '../VideoWorkerCommandType/VideoWorkerCommandType.js'

export const commandMap = {
  [VideoWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [VideoWorkerCommandType.VideoRecordingStart]: VideoRecording.start,
  [VideoWorkerCommandType.VideoRecordingAddChapter]: VideoChapter.addChapter,
  [VideoWorkerCommandType.VideoRecordingFinalize]: Finalize.finalize,
}
