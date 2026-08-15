import { getArrayBufferBytes, type ArrayBufferBytes } from '../GetArrayBufferBytes/GetArrayBufferBytes.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export interface ArrayBufferBytesComparison {
  readonly after: ArrayBufferBytes
  readonly before: ArrayBufferBytes
  readonly delta: ArrayBufferBytes
  readonly isLeak: boolean
}

export const compareArrayBufferBytes = async (beforePath: string, afterPath: string): Promise<ArrayBufferBytesComparison> => {
  const [beforeSnapshot, afterSnapshot] = await Promise.all([prepareHeapSnapshot(beforePath, {}), prepareHeapSnapshot(afterPath, {})])
  const before = getArrayBufferBytes(beforeSnapshot)
  const after = getArrayBufferBytes(afterSnapshot)
  const delta = {
    backingStoreCount: after.backingStoreCount - before.backingStoreCount,
    bytes: after.bytes - before.bytes,
  }
  return { after, before, delta, isLeak: delta.bytes > 0 }
}
