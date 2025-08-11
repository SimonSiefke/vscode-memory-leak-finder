import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as VideoRecordingWorkerPath from '../VideoRecordingWorkerPath/VideoRecordingWorkerPath.js'

export const start = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    path: VideoRecordingWorkerPath.videoRecordingWorkerPath,
    stdio: 'inherit',
    commandMap: {},
  })
  return rpc
}
