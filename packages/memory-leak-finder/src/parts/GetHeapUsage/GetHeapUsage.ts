import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export interface HeapUsage {
  /** Bytes of ArrayBuffer and external string backing stores; omitted by older runtimes. */
  readonly backingStorageSize?: number
  /** Bytes used by the embedder heap (Oilpan in Blink); omitted by older runtimes. */
  readonly embedderHeapUsedSize?: number
  readonly totalSize: number
  readonly usedSize: number
}

export const getHeapUsage = async (session: Session): Promise<HeapUsage> => {
  const heapUsage = await DevtoolsProtocolRuntime.getHeapUsage(session, {})
  return heapUsage
}
