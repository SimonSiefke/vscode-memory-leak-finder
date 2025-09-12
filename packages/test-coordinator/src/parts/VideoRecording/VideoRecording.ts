import type { Rpc } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Assert from '../Assert/Assert.ts'
import * as VideoRecordingWorker from '../LaunchVideoRecordingWorker/LaunchVideoRecordingWorker.ts'
import * as Root from '../Root/Root.ts'

interface State {
  rpc: Rpc | undefined
}

const state: State = {
  rpc: undefined,
}

export const start = async (devtoolsWebsocketUrl: string, attachedToPageTimeout: number, idleTimeout: number) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await VideoRecordingWorker.start()
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl, attachedToPageTimeout, idleTimeout)
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
