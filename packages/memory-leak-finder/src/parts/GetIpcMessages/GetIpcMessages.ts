import type { Dynamic } from '../Types/Types.ts'
import type { Session } from '../Session/Session.ts'
import * as CleanIpcMessages from '../CleanIpcMessages/CleanIpcMessages.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
export const getIpcMessages = async (session: Session): Promise<Dynamic> => {
  const result = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis.__ipcMessages || []`,
    generatePreview: true,
    returnByValue: true,
  })
  const messages = result
  const cleanedMessages = CleanIpcMessages.cleanMessages(messages)
  return cleanedMessages
}
