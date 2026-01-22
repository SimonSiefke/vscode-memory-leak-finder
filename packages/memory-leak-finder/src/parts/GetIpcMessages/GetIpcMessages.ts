import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as GetValue from '../GetValue/GetValue.ts'

export const getIpcMessages = async (session: Session): Promise<void> => {
  // Get the IPC messages array from global state
  const result = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `globalThis.__ipcMessages || []`,
    generatePreview: true,
    returnByValue: true,
  })

  const messages = GetValue.getValue(result.result)

  // Write to file
  if (messages && messages.length > 0) {
    const fs = require('fs')
    const path = '/tmp/ipc-messages.txt'
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] IPC Messages: ${JSON.stringify(messages, null, 2)}\n`

    try {
      fs.appendFileSync(path, logEntry)
    } catch (error) {
      // If file doesn't exist, create it
      fs.writeFileSync(path, logEntry)
    }
  }
}
