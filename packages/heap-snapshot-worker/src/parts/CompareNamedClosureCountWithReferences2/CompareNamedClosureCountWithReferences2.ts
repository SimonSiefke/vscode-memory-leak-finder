import {
  compareNamedClosureCountFromHeapSnapshotInternal2,
  type CompareClosuresOptions,
} from '../CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import { enrichLeakedClosuresWithReferences } from '../EnrichLeakedClosuresWithReferences/EnrichLeakedClosuresWithReferences.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'

export interface LeakedClosureWithReferences {
  readonly nodeName: string
  readonly references: readonly ReferencePath[]
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshot2 = async (
  pathA: string,
  pathB: string,
  options: CompareClosuresOptions = {},
): Promise<Record<string, readonly LeakedClosureWithReferences[]>> => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])

  const leaked = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB, options)
  const enriched = enrichLeakedClosuresWithReferences(leaked, snapshotB)

  return enriched
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2 = async (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
  options: CompareClosuresOptions = {},
): Promise<Record<string, readonly LeakedClosureWithReferences[]>> => {
  const leaked = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB, options)
  const enriched = enrichLeakedClosuresWithReferences(leaked, snapshotB)
  return enriched
}
