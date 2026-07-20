import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const forceGarbageCollection = async (session: Session): Promise<void> => {
  await DevtoolsProtocolHeapProfiler.collectGarbage(session)
}
