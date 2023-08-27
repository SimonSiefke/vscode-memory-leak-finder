import * as Assert from '../Assert/Assert.js'
import * as VideoRecordingWorker from '../VideoRecordingWorker/VideoRecordingWorker.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'

export const start = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const ipc = VideoRecordingWorker.launch()
  HandleIpc.handleIpc(ipc)
  await JsonRpc.invoke(ipc, 'ConnectDevtools.connectDevtools')
  await JsonRpc.invoke(ipc, 'VideoRecording.start')
}
