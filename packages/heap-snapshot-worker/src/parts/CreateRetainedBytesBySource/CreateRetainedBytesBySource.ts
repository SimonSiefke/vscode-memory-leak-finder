import { rmSync } from 'node:fs'
import { getRetainedBytesBySource, type RetainedBytesBySourceReport } from '../GetRetainedBytesBySource/GetRetainedBytesBySource.ts'
import type { MemoryCityScriptMap } from '../MemoryCityTypes/MemoryCityTypes.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export const createRetainedBytesBySource = async (
  path: string,
  scriptMap: MemoryCityScriptMap = {},
  minimumCount = 1,
): Promise<RetainedBytesBySourceReport> => {
  process.once('exit', () => rmSync(path, { force: true }))
  const snapshot = await prepareHeapSnapshot(path, { parseStrings: true })
  return getRetainedBytesBySource(snapshot, scriptMap, minimumCount)
}
