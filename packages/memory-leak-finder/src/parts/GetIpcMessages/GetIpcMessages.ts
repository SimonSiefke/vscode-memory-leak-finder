import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'

export const getIpcMessages = async (session: Session): Promise<void> => {
  // Get the IPC messages array from global state
  const result = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis.__ipcMessages || []`,
    generatePreview: true,
    returnByValue: true,
  })
  return result
}
