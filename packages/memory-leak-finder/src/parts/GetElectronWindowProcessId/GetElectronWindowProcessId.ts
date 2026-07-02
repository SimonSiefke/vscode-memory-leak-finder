import type { Dynamic } from '../Types/Types.ts'
import * as DebuggerCreateIpcConnection from '../DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

const escapeString = (value: string): string => {
  return JSON.stringify(value)
}

export const getElectronWindowProcessId = async (electronWebSocketUrl: string, targetId: string): Promise<number | undefined> => {
  if (!electronWebSocketUrl || !targetId) {
    return undefined
  }
  const electronRpc = await DebuggerCreateIpcConnection.createConnection(electronWebSocketUrl)
  try {
    const result = await DevtoolsProtocolRuntime.evaluate(electronRpc, {
      expression: `(() => {
        const electron = require('electron')
        const targetWebContents = electron.webContents.fromDevToolsTargetId(${escapeString(targetId)})
        if (!targetWebContents || typeof targetWebContents.getOSProcessId !== 'function') {
          return undefined
        }
        return targetWebContents.getOSProcessId()
      })()`,
      returnByValue: true,
    })
    if (typeof result !== 'number' || !Number.isFinite(result) || result <= 0) {
      return undefined
    }
    return result
  } finally {
    await (electronRpc as Dynamic).dispose()
  }
}
