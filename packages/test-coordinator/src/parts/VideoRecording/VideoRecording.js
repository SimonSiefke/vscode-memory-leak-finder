import * as Assert from '../Assert/Assert.js'
import * as VideoRecordingWorker from '../VideoRecordingWorker/VideoRecordingWorker.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Command from '../Command/Command.js'
import * as Callback from '../Callback/Callback.js'

export const start = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const ipc = await VideoRecordingWorker.start()
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
  await JsonRpc.invoke(ipc, 'ConnectDevtools.connectDevtools')
  await JsonRpc.invoke(ipc, 'VideoRecording.start')
  console.log('worker ready')
}
