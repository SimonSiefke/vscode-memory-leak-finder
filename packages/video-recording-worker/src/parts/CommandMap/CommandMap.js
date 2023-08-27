import * as VideoWorkerCommandType from '../VideoWorkerCommandType/VideoWorkerCommandType.js'
import * as RunTests from '../RunTests/RunTests.js'
import * as Exit from '../Exit/Exit.js'

export const commandMap = {
  [VideoWorkerCommandType.VideoRecordingStart]: RunTests.runTests,
  [VideoWorkerCommandType.ConnectDevtools]: Exit.exit,
}
