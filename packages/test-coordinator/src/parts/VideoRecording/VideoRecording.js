import { join } from 'node:path'
import * as Assert from '../Assert/Assert.js'
import * as Callback from '../Callback/Callback.js'
import * as Command from '../Command/Command.js'
import * as HandleIpc from '../HandleIpc/HandleIpc.js'
import * as JsonRpc from '../JsonRpc/JsonRpc.js'
import * as Root from '../Root/Root.js'
import * as VideoRecordingWorker from '../VideoRecordingWorker/VideoRecordingWorker.js'

export const state = {
  /**
   * @type {any}
   */
  ipc: undefined,
}

export const start = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const ipc = await VideoRecordingWorker.start()
  HandleIpc.handleIpc(ipc, Command.execute, Callback.resolve)
  await JsonRpc.invoke(ipc, 'ConnectDevtools.connectDevtools', devtoolsWebsocketUrl)
  const outFile = join(Root.root, '.vscode-videos', 'video.webm')
  await JsonRpc.invoke(ipc, 'VideoRecording.start', outFile)
  state.ipc = ipc
}

export const addChapter = (name, time) => {
  const { ipc } = state
  return JsonRpc.invoke(ipc, 'VideoRecording.addChapter', name, time)
}

export const finalize = () => {
  const { ipc } = state
  return JsonRpc.invoke(ipc, 'VideoRecording.finalize')
}
