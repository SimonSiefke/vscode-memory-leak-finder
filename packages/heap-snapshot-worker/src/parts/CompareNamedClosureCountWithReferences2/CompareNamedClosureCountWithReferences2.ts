import { readFile } from 'node:fs/promises'
import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'
import { addUrls } from '../AddUrls/AddUrls.ts'
import {
  compareNamedClosureCountFromHeapSnapshotInternal2,
  type CompareClosuresOptions,
} from '../CompareNamedClosureCountInternal2/CompareNamedClosureCountInternal2.ts'
import { enrichLeakedClosuresWithReferences } from '../EnrichLeakedClosuresWithReferences/EnrichLeakedClosuresWithReferences.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

export interface ReferencePathWithCount extends ReferencePath {
  readonly count: number
}

export interface ReferencePathWithCount extends ReferencePath {
  readonly count: number
}

export interface LeakedClosureWithReferences {
  readonly count: number
  readonly nodeName: string
  readonly references: readonly ReferencePathWithCount[]
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
  console.log({ enriched, leaked })
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

const normalizePath = (path: string): string => {
  // Replace node IDs in paths like [array 3018681].internal with [array].internal
  // This allows us to merge references that differ only by node ID
  return path.replaceAll(/\[(\w+)\s+\d+\]/g, '[$1]')
}

const areReferencePathsEqual = (a: ReferencePath, b: ReferencePath): boolean => {
  return (
    a.sourceNodeName === b.sourceNodeName &&
    a.sourceNodeType === b.sourceNodeType &&
    a.edgeType === b.edgeType &&
    a.edgeName === b.edgeName &&
    normalizePath(a.path) === normalizePath(b.path)
  )
}

const groupAndCountReferencePaths = (referencePaths: readonly ReferencePath[]): readonly ReferencePathWithCount[] => {
  const grouped: ReferencePath[] = []
  const counts: number[] = []

  for (const ref of referencePaths) {
    let found = false
    for (let i = 0; i < grouped.length; i++) {
      if (areReferencePathsEqual(ref, grouped[i])) {
        counts[i] = (counts[i] || 1) + 1
        found = true
        break
      }
    }
    if (!found) {
      grouped.push(ref)
      counts.push(1)
    }
  }

  const result: ReferencePathWithCount[] = []
  for (let i = 0; i < grouped.length; i++) {
    result.push({
      ...grouped[i],
      count: counts[i] || 1,
    })
  }

  result.sort((a, b) => {
    if (a.count > b.count) {
      return -1
    }
    if (a.count < b.count) {
      return 1
    }
    return 0
  })

  return result
}

const areReferencesEqual = (
  a: { readonly nodeName: string; readonly references: readonly ReferencePath[] },
  b: { readonly nodeName: string; readonly references: readonly ReferencePath[] },
): boolean => {
  if (a.nodeName !== b.nodeName) {
    return false
  }
  if (a.references.length !== b.references.length) {
    return false
  }
  for (let i = 0; i < a.references.length; i++) {
    const refA = a.references[i]
    const refB = b.references[i]
    if (!areReferencePathsEqual(refA, refB)) {
      return false
    }
  }
  return true
}

const groupAndCountReferences = (
  references: readonly { readonly nodeName: string; readonly references: readonly ReferencePath[] }[],
): readonly LeakedClosureWithReferences[] => {
  const grouped: { readonly nodeName: string; readonly references: readonly ReferencePath[] }[] = []
  const counts: number[] = []

  for (const ref of references) {
    let found = false
    for (let i = 0; i < grouped.length; i++) {
      if (areReferencesEqual(ref, grouped[i])) {
        counts[i] = (counts[i] || 1) + 1
        found = true
        break
      }
    }
    if (!found) {
      grouped.push(ref)
      counts.push(1)
    }
  }

  const result: LeakedClosureWithReferences[] = []
  for (let i = 0; i < grouped.length; i++) {
    const groupedReferencePaths = groupAndCountReferencePaths(grouped[i].references)
    result.push({
      count: counts[i] || 1,
      nodeName: grouped[i].nodeName,
      references: groupedReferencePaths,
    })
  }

  result.sort((a, b) => {
    if (a.count > b.count) {
      return -1
    }
    if (a.count < b.count) {
      return 1
    }
    return 0
  })

  return result
}

const transformToArray = (
  result: Record<string, readonly { readonly nodeName: string; readonly references: readonly ReferencePath[] }[]>,
): readonly LocationWithReferences[] => {
  const array: LocationWithReferences[] = []
  for (const [location, references] of Object.entries(result)) {
    const groupedReferences = groupAndCountReferences(references)
    array.push({
      location,
      references: groupedReferences,
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
