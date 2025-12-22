import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export interface HeapUsage {
  readonly totalSize: number
  readonly usedSize: number
}

export const getHeapUsage = async (session: Session): Promise<HeapUsage> => {
  const heapUsage = await DevtoolsProtocolRuntime.getHeapUsage(session, {})
  return heapUsage
}
