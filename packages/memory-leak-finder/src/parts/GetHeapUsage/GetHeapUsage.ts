import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import type { Session } from '../Session/Session.ts'

export interface HeapUsage {
  readonly usedSize: number
  readonly totalSize: number
}

export const getHeapUsage = async (session: Session): Promise<HeapUsage> => {
  const heapUsage = await DevtoolsProtocolRuntime.getHeapUsage(session, {})
  return heapUsage
}
