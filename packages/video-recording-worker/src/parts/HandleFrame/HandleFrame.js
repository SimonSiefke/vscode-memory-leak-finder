import { mkdir } from 'node:fs/promises'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as VideosPath from '../VideosPath/VideosPath.js'

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
