import type { Session } from '../Session/Session.ts'
import * as DevtoolsProtocolTarget from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as DebuggerCreateSessionRpcConnection from '../DebuggerCreateSessionRpcConnection/DebuggerCreateSessionRpcConnection.ts'

export interface NodeProcess {
  readonly targetId: string
  readonly sessionId: string
  readonly title: string
  readonly url: string
  readonly session: Session
}

export const getNodeProcesses = async (browserSession: Session): Promise<readonly NodeProcess[]> => {
  const targets = await DevtoolsProtocolTarget.getTargets(browserSession)
  const nodeProcesses: NodeProcess[] = []

  for (const target of targets) {
    if (target.type === 'node' && target.attached) {
      const sessionId = target.sessionId
      if (sessionId) {
        // Create a session RPC connection for this Node process
        const sessionRpc = DebuggerCreateSessionRpcConnection.createSessionRpcConnection(browserSession, sessionId)

        nodeProcesses.push({
          targetId: target.targetId,
          sessionId,
          title: target.title || `Node Process ${target.targetId}`,
          url: target.url || '',
          session: sessionRpc,
        })
      }
    }
  }

  return nodeProcesses
}
