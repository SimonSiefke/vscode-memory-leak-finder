import { mkdir } from 'node:fs/promises'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'
import * as SessionState from '../SessionState/SessionState.ts'
import * as VideosPath from '../VideosPath/VideosPath.ts'

export const handleFrame = async (message) => {
  const ffmpegProcess = FfmpegProcessState.get()
  if (!ffmpegProcess || !ffmpegProcess.stdin) {
    return
  }
  const { data, sessionId } = message.params
  await mkdir(VideosPath.videosPath, { recursive: true })
  ffmpegProcess.stdin.write(data, 'base64')
  const session = SessionState.getSession(message.sessionId)
  await DevtoolsProtocolPage.screencastFrameAck(session.rpc, { sessionId })
}
