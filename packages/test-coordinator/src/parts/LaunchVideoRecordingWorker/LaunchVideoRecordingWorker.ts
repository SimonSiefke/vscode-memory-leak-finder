import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import * as VideoRecordingWorkerPath from '../VideoRecordingWorkerPath/VideoRecordingWorkerPath.ts'

export const start = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: VideoRecordingWorkerPath.videoRecordingWorkerPath,
    stdio: 'inherit',
  })
  await rpc.invoke('VideoRecording.initialize')
  return rpc
}
