import { join } from 'node:path'
import * as Root from '../Root/Root.js'
import { mkdir, writeFile } from 'node:fs/promises'
import * as SessionState from '../SessionState/SessionState.js'
import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.js'

let i = 1

export const handleFrame = async (message) => {
  const { data, metadata, sessionId } = message.params
  const session = SessionState.getSession(message.sessionId)
  await DevtoolsProtocolPage.screencastFrameAck(session.rpc, { sessionId })
  const videosPath = join(Root.root, '.videos')
  await mkdir(videosPath, { recursive: true })
  const jpegPath = join(videosPath, `${i++}.jpeg`)
  await writeFile(jpegPath, data, 'base64')
}
