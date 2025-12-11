import { readFile } from 'node:fs/promises'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'
import { collectLeakedNodeByteOffsets } from '../CollectLeakedNodeByteOffsets/CollectLeakedNodeByteOffsets.ts'
import { initializeReferencesMap } from '../InitializeReferencesMap/InitializeReferencesMap.ts'
import { collectReferencesToLeakedNodes } from '../CollectReferencesToLeakedNodes/CollectReferencesToLeakedNodes.ts'
import { enrichClosuresWithReferences } from '../EnrichClosuresWithReferences/EnrichClosuresWithReferences.ts'

export interface LeakedClosureWithReferences {
  readonly nodeName: string
  readonly references: readonly ReferencePath[]
}

export const enrichLeakedClosuresWithReferences = (
  leakedClosures: Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>,
  snapshot: Snapshot,
): Record<string, readonly LeakedClosureWithReferences[]> => {
  const leakedNodeByteOffsets = collectLeakedNodeByteOffsets(leakedClosures)
  const referencesMap = initializeReferencesMap(leakedNodeByteOffsets)
  collectReferencesToLeakedNodes(snapshot, leakedNodeByteOffsets, referencesMap)
  return enrichClosuresWithReferences(leakedClosures, referencesMap)
}
