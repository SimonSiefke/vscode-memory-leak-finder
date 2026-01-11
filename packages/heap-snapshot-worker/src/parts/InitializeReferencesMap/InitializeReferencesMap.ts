import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'

export const initializeReferencesMap = (leakedNodeByteOffsets: Set<number>): Map<number, Array<ReferencePath>> => {
  const referencesMap = new Map<number, Array<ReferencePath>>()
  for (const byteOffset of leakedNodeByteOffsets) {
    referencesMap.set(byteOffset, [])
  }
  return referencesMap
}
