import {
  compareNamedClosureCountFromHeapSnapshotInternal2,
  type CompareClosuresOptions,
} from '../CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import { enrichLeakedClosuresWithReferences } from '../EnrichLeakedClosuresWithReferences/EnrichLeakedClosuresWithReferences.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface LeakedClosureWithReferences {
  readonly nodeIndex: number
  readonly nodeName: string
  readonly nodeId: number
  readonly references: readonly {
    readonly sourceNodeIndex: number
    readonly sourceNodeId: number
    readonly sourceNodeName: string | null
    readonly sourceNodeType: string | null
    readonly edgeType: string
    readonly edgeName: string
    readonly path: string
  }[]
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

  const leaked = (await compareNamedClosureCountFromHeapSnapshotInternal2(
    snapshotA,
    snapshotB,
    options,
  )) as unknown as Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>
  const enriched = enrichLeakedClosuresWithReferences(leaked, snapshotB)

  return enriched
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2 = async (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
  options: CompareClosuresOptions = {},
): Promise<Record<string, readonly LeakedClosureWithReferences[]>> => {
  const leaked = (await compareNamedClosureCountFromHeapSnapshotInternal2(
    snapshotA,
    snapshotB,
    options,
  )) as unknown as Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>
  const enriched = enrichLeakedClosuresWithReferences(leaked, snapshotB)

  return enriched
}
