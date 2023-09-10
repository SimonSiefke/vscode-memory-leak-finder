import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.js'
import * as SessionState from '../SessionState/SessionState.js'
import * as VideosPath from '../VideosPath/VideosPath.js'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.js'

let i = 1

export const handleFrame = async (message) => {
  const ffmpegProcess = FfmpegProcessState.get()
  if (!ffmpegProcess || !ffmpegProcess.stdin) {
    return
  }
  // console.log({ ffmpegProcess: true })
  const { data, metadata, sessionId } = message.params
  console.log('write frame', data.length)
  ffmpegProcess.stdin.write(data, 'base64')
  const session = SessionState.getSession(message.sessionId)
  await DevtoolsProtocolPage.screencastFrameAck(session.rpc, { sessionId })
  await mkdir(VideosPath.videosPath, { recursive: true })
  const jpegPath = join(VideosPath.videosPath, `${i++}.jpeg`)
  await writeFile(jpegPath, data, 'base64')
}
