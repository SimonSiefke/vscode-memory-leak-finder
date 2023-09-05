import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'
import * as VideoRecording from '../VideoRecording/VideoRecording.js'
import * as VideoWorkerCommandType from '../VideoWorkerCommandType/VideoWorkerCommandType.js'

export const commandMap = {
  [VideoWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
  [VideoWorkerCommandType.VideoRecordingStart]: VideoRecording.start,
}
