import { join } from 'node:path'
import * as Assert from '../Assert/Assert.ts'
import * as VideoRecordingWorker from '../LaunchVideoRecordingWorker/LaunchVideoRecordingWorker.ts'
import * as Root from '../Root/Root.ts'

export const start = async (
  platform: string,
  arch: string,
  devtoolsWebsocketUrl: string,
  attachedToPageTimeout: number,
  idleTimeout: number,
  screencastQuality: number,
  compressVideo: boolean,
) => {
  Assert.string(devtoolsWebsocketUrl)
  const rpc = await VideoRecordingWorker.start(platform, arch)
  await rpc.invoke('ConnectDevtools.connectDevtools', devtoolsWebsocketUrl, attachedToPageTimeout, idleTimeout, screencastQuality)
  const outFile = join(Root.root, '.vscode-videos', 'video.webm')
  await rpc.invoke('VideoRecording.start', platform, outFile, compressVideo)
  return rpc
}

export const addChapter = (rpc, name, time) => {
  return rpc.invoke('VideoRecording.addChapter', name, time)
}

export const finalize = (rpc) => {
  return rpc.invoke('VideoRecording.finalize')
}
