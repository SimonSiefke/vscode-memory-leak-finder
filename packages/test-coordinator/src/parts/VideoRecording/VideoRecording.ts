import { join } from 'node:path'
import * as Assert from '../Assert/Assert.ts'
import * as VideoRecordingWorker from '../LaunchVideoRecordingWorker/LaunchVideoRecordingWorker.ts'
import * as Root from '../Root/Root.ts'

export const start = async (devtoolsWebsocketUrl: string, attachedToPageTimeout: number, idleTimeout: number) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await VideoRecordingWorker.start()
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl, attachedToPageTimeout, idleTimeout)
  const outFile = join(Root.root, '.vscode-videos', 'video.webm')
  await rpc.invoke('VideoRecording.start', outFile)
  return rpc
}

export const addChapter = (rpc, name, time) => {
  return rpc.invoke('VideoRecording.addChapter', name, time)
}

export const setTestStatus = (rpc, testName, status) => {
  return rpc.invoke('VideoRecording.setTestStatus', testName, status)
}

export const finalize = (rpc) => {
  return rpc.invoke('VideoRecording.finalize')
}
