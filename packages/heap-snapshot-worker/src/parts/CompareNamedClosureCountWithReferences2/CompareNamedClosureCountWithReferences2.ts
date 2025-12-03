import {
  compareNamedClosureCountFromHeapSnapshotInternal2,
  type CompareClosuresOptions,
} from '../CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import { enrichLeakedClosuresWithReferences } from '../EnrichLeakedClosuresWithReferences/EnrichLeakedClosuresWithReferences.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

export interface LeakedClosureWithReferences {
  readonly nodeName: string
  readonly references: readonly {
    readonly sourceNodeName: string | null
    readonly sourceNodeType: string | null
    readonly edgeType: string
    readonly edgeName: string
    readonly path: string
    readonly count: number
  }[]
  readonly count: number
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshot2 = async (
  pathA: string,
  pathB: string,
  scriptMapPath?: string,
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
  const enriched = await enrichLeakedClosuresWithReferences(leaked, snapshotB, scriptMapPath)

  return enriched
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2 = async (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
  scriptMapPath?: string,
  options: CompareClosuresOptions = {},
): Promise<Record<string, readonly LeakedClosureWithReferences[]>> => {
  const leaked = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB, options)
  const enriched = await enrichLeakedClosuresWithReferences(leaked, snapshotB, scriptMapPath)
  return enriched
}
