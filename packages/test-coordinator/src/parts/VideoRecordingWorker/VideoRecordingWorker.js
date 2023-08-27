import * as IpcParent from '../IpcParent/IpcParent.js'
import * as IpcParentType from '../IpcParentType/IpcParentType.js'
import * as VideoRecordingWorkerPath from '../VideoRecordingWorkerPath/VideoRecordingWorkerPath.js'

export const start = async () => {
  const ipc = await IpcParent.create({
    method: IpcParentType.NodeWorkerThread,
    url: VideoRecordingWorkerPath.videoRecordingWorkerPath,
  })
  return ipc
}
