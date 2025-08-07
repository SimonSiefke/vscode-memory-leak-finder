import { join } from 'node:path'
import * as Assert from '../Assert/Assert.js'
import * as Root from '../Root/Root.js'
import * as VideoRecordingWorker from '../VideoRecordingWorker/VideoRecordingWorker.js'

export const state = {
  /**
   * @type {import('@lvce-editor/rpc').Rpc|undefined}
   */
  rpc: undefined,
}

export const start = async (devtoolsWebsocketUrl) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await VideoRecordingWorker.start()
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl)
  const outFile = join(Root.root, '.vscode-videos', 'video.webm')
  await rpc.invoke('VideoRecording.start', outFile)
  state.rpc = rpc
}

export const addChapter = (name, time) => {
  const { rpc } = state
  if (!rpc) {
    return
  }
  return rpc.invoke('VideoRecording.addChapter', name, time)
}

export const finalize = () => {
  const { rpc } = state
  if (!rpc) {
    return
  }
  return rpc.invoke('VideoRecording.finalize')
}
