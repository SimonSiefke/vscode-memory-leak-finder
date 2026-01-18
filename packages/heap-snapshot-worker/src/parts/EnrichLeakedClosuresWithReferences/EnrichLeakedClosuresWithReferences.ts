import { readFile } from 'node:fs/promises'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { LeakedClosureWithReferences } from './LeakedClosureWithReferences.ts'
import { collectLeakedNodeByteOffsets } from '../CollectLeakedNodeByteOffsets/CollectLeakedNodeByteOffsets.ts'
import { collectReferencesToLeakedNodes } from '../CollectReferencesToLeakedNodes/CollectReferencesToLeakedNodes.ts'
import { enrichClosuresWithReferences } from '../EnrichClosuresWithReferences/EnrichClosuresWithReferences.ts'
import { initializeReferencesMap } from '../InitializeReferencesMap/InitializeReferencesMap.ts'

export const enrichLeakedClosuresWithReferences = (
  leakedClosures: Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>,
  snapshot: Snapshot,
): Record<string, readonly LeakedClosureWithReferences[]> => {
  const leakedNodeByteOffsets = collectLeakedNodeByteOffsets(leakedClosures)
  const referencesMap = initializeReferencesMap(leakedNodeByteOffsets)
  collectReferencesToLeakedNodes(snapshot, leakedNodeByteOffsets, referencesMap)
  return enrichClosuresWithReferences(leakedClosures, referencesMap)
}

export { type LeakedClosureWithReferences } from './LeakedClosureWithReferences.ts'
