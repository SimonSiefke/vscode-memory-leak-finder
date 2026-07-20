import { rmSync } from 'node:fs'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import type { MemoryCityScriptMap, MemoryCitySnapshot } from '../MemoryCityTypes/MemoryCityTypes.ts'
import { getMemoryCitySnapshot } from '../GetMemoryCitySnapshot/GetMemoryCitySnapshot.ts'

export const createMemoryCitySnapshot = async (path: string, scriptMap: MemoryCityScriptMap = {}): Promise<MemoryCitySnapshot> => {
  process.once('exit', () => rmSync(path, { force: true }))
  const snapshot = await prepareHeapSnapshot(path, { parseStrings: true })
  return getMemoryCitySnapshot(snapshot, scriptMap)
}
