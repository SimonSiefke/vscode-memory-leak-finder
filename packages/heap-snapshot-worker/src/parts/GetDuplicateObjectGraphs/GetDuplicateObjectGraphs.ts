import {
  defaultLimits,
  type DuplicateObjectGraphLimits,
  type DuplicateObjectGraphReport,
} from '../DuplicateObjectGraphTypes/DuplicateObjectGraphTypes.ts'
import { getDuplicateObjectGraphNodes } from '../GetDuplicateObjectGraphNodes/GetDuplicateObjectGraphNodes.ts'
import { hashDuplicateObjectGraphs } from '../HashDuplicateObjectGraphs/HashDuplicateObjectGraphs.ts'
import type { Snapshot } from '../Snapshot/Snapshot.ts'

interface MutableGroup {
  representative: number
  count: number
  totalBytes: number
  readonly examples: number[]
}

export const getDuplicateObjectGraphs = (
  snapshot: Snapshot,
  options: Partial<DuplicateObjectGraphLimits> = {},
): DuplicateObjectGraphReport => {
  const limits = { ...defaultLimits, ...options }
  for (const [name, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`duplicate-object-graphs: ${name} must be a positive safe integer`)
  }
  const graph = getDuplicateObjectGraphNodes(snapshot, limits)
  const hashes = hashDuplicateObjectGraphs(graph)
  const { objects, objectIndex, leaf, id, size } = graph
  let comparisonWork = 0
  let unverifiedObjects = graph.unverifiedObjects
  const equal = (leftRoot: number, rightRoot: number): boolean | undefined => {
    const leftToRight = new Map<number, number>()
    const rightToLeft = new Map<number, number>()
    const leftStack = [objects[leftRoot].ordinal]
    const rightStack = [objects[rightRoot].ordinal]
    while (leftStack.length) {
      if (++comparisonWork > limits.maxComparisonWork) return undefined
      const leftOrdinal = leftStack.pop()!
      const rightOrdinal = rightStack.pop()!
      const leftIndex = objectIndex[leftOrdinal]
      const rightIndex = objectIndex[rightOrdinal]
      if (leftIndex < 0 || rightIndex < 0) {
        if (leftIndex !== rightIndex || leaf(leftOrdinal) !== leaf(rightOrdinal)) return false
        continue
      }
      const mapped = leftToRight.get(leftIndex)
      if (mapped !== undefined) {
        if (mapped !== rightIndex) return false
        continue
      }
      if (rightToLeft.has(rightIndex)) return false
      leftToRight.set(leftIndex, rightIndex)
      rightToLeft.set(rightIndex, leftIndex)
      if (leftToRight.size > limits.maxComparisonNodes) return undefined
      const left = objects[leftIndex]
      const right = objects[rightIndex]
      if (left.prototype !== right.prototype || left.properties.length !== right.properties.length) return false
      for (let index = 0; index < left.properties.length; index++) {
        if (++comparisonWork > limits.maxComparisonWork) return undefined
        if (left.properties[index].key !== right.properties[index].key) return false
        leftStack.push(left.properties[index].target)
        rightStack.push(right.properties[index].target)
      }
    }
    return true
  }
  const buckets = new Map<string, MutableGroup[]>()
  for (let index = 0; index < objects.length; index++) {
    if (comparisonWork >= limits.maxComparisonWork) {
      unverifiedObjects += objects.length - index
      break
    }
    const fingerprint = hashes[index]
    const bucket = buckets.get(fingerprint) ?? []
    let match: MutableGroup | undefined
    let verified = true
    for (const group of bucket) {
      const same = equal(group.representative, index)
      if (same === undefined) {
        verified = false
        break
      }
      if (same) {
        match = group
        break
      }
    }
    if (!verified) {
      unverifiedObjects++
      continue
    }
    const ordinal = objects[index].ordinal
    if (match) {
      match.count++
      match.totalBytes += size(ordinal)
      if (match.examples.length < 8) match.examples.push(id(ordinal))
      if (size(ordinal) < size(objects[match.representative].ordinal)) match.representative = index
    } else {
      bucket.push({ representative: index, count: 1, totalBytes: size(ordinal), examples: [id(ordinal)] })
      buckets.set(fingerprint, bucket)
    }
  }
  const groups = [...buckets]
    .flatMap(([fingerprint, bucket]) =>
      bucket
        .filter((group) => group.count > 1)
        .map((group) => {
          const object = objects[group.representative]
          return {
            fingerprint,
            count: group.count,
            duplicateCount: group.count - 1,
            duplicateBytes: group.totalBytes - size(object.ordinal),
            representativeNodeId: id(object.ordinal),
            exampleNodeIds: group.examples,
            preview: Object.fromEntries(
              object.properties.slice(0, 8).map((property) => [property.key.slice(0, 160), graph.preview(property.target)]),
            ),
          }
        }),
    )
    .sort(
      (a, b) =>
        b.duplicateBytes - a.duplicateBytes || b.duplicateCount - a.duplicateCount || a.representativeNodeId - b.representativeNodeId,
    )
  return {
    complete: unverifiedObjects === 0,
    duplicateBytes: groups.reduce((sum, group) => sum + group.duplicateBytes, 0),
    duplicateObjects: groups.reduce((sum, group) => sum + group.duplicateCount, 0),
    groups,
    statistics: { analyzedObjects: objects.length, opaqueObjects: graph.opaqueObjects, comparisonWork, unverifiedObjects },
    limits,
  }
}
