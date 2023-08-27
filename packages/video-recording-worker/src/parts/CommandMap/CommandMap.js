import * as VideoWorkerCommandType from '../VideoWorkerCommandType/VideoWorkerCommandType.js'
import * as ConnectDevtools from '../ConnectDevtools/ConnectDevtools.js'

export const commandMap = {
  [VideoWorkerCommandType.VideoRecordingStart]: ConnectDevtools.connectDevtools,
  [VideoWorkerCommandType.ConnectDevtools]: ConnectDevtools.connectDevtools,
}
