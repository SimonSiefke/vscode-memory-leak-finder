import { mkdir } from 'node:fs/promises'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as FfmpegProcessState from '../FfmpegProcessState/FfmpegProcessState.ts'
import * as PTimeout from '../PTimeout/PTimeout.ts'
import * as ScreencastQuality from '../ScreencastQuality/ScreencastQuality.ts'
import * as VideosPath from '../VideosPath/VideosPath.ts'

export const connectScreenRecording = async (sessionRpc: any, attachedToPageTimeout: number): Promise<void> => {
  const handleFrame = async (message: any): Promise<void> => {
    const ffmpegProcess = FfmpegProcessState.get()
    if (!ffmpegProcess || !ffmpegProcess.stdin) {
      return
    }
    const { data, sessionId } = message.params
    await mkdir(VideosPath.videosPath, { recursive: true })
    ffmpegProcess.stdin.write(data, 'base64')
    await DevtoolsProtocolPage.screencastFrameAck(sessionRpc, { sessionId })
  }

  sessionRpc.on(DevtoolsEventType.PageScreencastFrame, handleFrame)

  await PTimeout.pTimeout(
    Promise.all([
      DevtoolsProtocolPage.enable(sessionRpc),
      DevtoolsProtocolPage.startScreencast(sessionRpc, {
        format: 'jpeg',
        quality: ScreencastQuality.screencastQuality,
        maxWidth: 1024,
        maxHeight: 768,
      }),
    ]),
    {
      milliseconds: attachedToPageTimeout,
    },
  )
}
