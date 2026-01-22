import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'
import * as CleanIpcMessages from '../CleanIpcMessages/CleanIpcMessages.ts'

export const getIpcMessages = async (session: Session): Promise<any> => {
  // Get the IPC messages array from global state
  const result = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis.__ipcMessages || []`,
    generatePreview: true,
    returnByValue: true,
  })

  const messages = result.result

  // Clean up the messages by deserializing VSCode binary data
  const cleanedMessages = CleanIpcMessages.cleanMessages(messages)

  return cleanedMessages
}
