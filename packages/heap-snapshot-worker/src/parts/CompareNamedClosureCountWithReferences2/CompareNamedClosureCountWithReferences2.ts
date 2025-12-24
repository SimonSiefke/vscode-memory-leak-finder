import {
  compareNamedClosureCountFromHeapSnapshotInternal2,
  type CompareClosuresOptions,
} from '../CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import { enrichLeakedClosuresWithReferences } from '../EnrichLeakedClosuresWithReferences/EnrichLeakedClosuresWithReferences.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'
import { readFile } from 'fs/promises'
import { addUrls } from '../AddUrls/AddUrls.ts'

export interface LeakedClosureWithReferences {
  readonly nodeName: string
  readonly references: readonly ReferencePath[]
}

export interface LocationWithReferences {
  readonly location: string
  readonly references: readonly LeakedClosureWithReferences[]
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshot2 = async (
  pathA: string,
  pathB: string,
  scriptMapPath: string,

  options: CompareClosuresOptions = {},
): Promise<readonly LocationWithReferences[]> => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])

  const scriptMapContent = await readFile(scriptMapPath, 'utf8')
  const scriptMap = JSON.parse(scriptMapContent)
  const leaked = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB, scriptMap, options)
  const enriched = enrichLeakedClosuresWithReferences(leaked, snapshotB)
  console.log({ leaked, enriched })
  const final = addUrls(enriched, scriptMap)
  return transformToArray(final)
}

export const compareNamedClosureCountWithReferencesFromHeapSnapshotInternal2 = async (
  snapshotA: Snapshot,
  snapshotB: Snapshot,
  scriptMapPathOrScriptMap?: string | Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>,
  options: CompareClosuresOptions = {},
): Promise<readonly LocationWithReferences[]> => {
  let scriptMap: Record<number, { readonly url?: string; readonly sourceMapUrl?: string }>
  if (typeof scriptMapPathOrScriptMap === 'string') {
    const scriptMapContent = await readFile(scriptMapPathOrScriptMap, 'utf8')
    scriptMap = JSON.parse(scriptMapContent)
  } else {
    scriptMap = scriptMapPathOrScriptMap || {}
  }
  const leaked = await compareNamedClosureCountFromHeapSnapshotInternal2(snapshotA, snapshotB, scriptMap, options)
  const enriched = enrichLeakedClosuresWithReferences(leaked, snapshotB)
  const final = addUrls(enriched, scriptMap)

  return transformToArray(final)
}

const transformToArray = (
  result: Record<string, readonly LeakedClosureWithReferences[]>,
): readonly LocationWithReferences[] => {
  const array: LocationWithReferences[] = []
  for (const [location, references] of Object.entries(result)) {
    array.push({
      location,
      references,
    })
  }
  array.sort((a, b) => {
    if (a.location < b.location) {
      return -1
    }
    if (a.location > b.location) {
      return 1
    }
    return 0
  })
  return array
}
