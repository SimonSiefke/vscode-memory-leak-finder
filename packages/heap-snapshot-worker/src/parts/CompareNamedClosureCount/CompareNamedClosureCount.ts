import * as Assert from '../Assert/Assert.ts'
import * as HeapSnapshotState from '../HeapSnapshotState/HeapSnapshotState.ts'
import * as IsImportantEdge from '../IsImportantEdge/IsImportantEdge.ts'
import * as ParseHeapSnapshot from '../ParseHeapSnapshot/ParseHeapSnapshot.ts'
import { prepareHeapSnapshot } from '../PrepareHeapSnapshot/PrepareHeapSnapshot.ts'

const isClosure = (node) => {
  return node.type === 'closure'
}

const isContext = (edge) => {
  return edge.name === 'context'
}

const getName = (node, contextNodes) => {
  if (node.name) {
    return node.name
  }
  return contextNodes
    .map((node) => node.name)
    .join(':')
    .slice(0, 100)
}

export const compareNamedClosureCountFromHeapSnapshot = async (pathA: string, pathB: string) => {
  const [snapshotA, snapshotB] = await Promise.all([
    prepareHeapSnapshot(pathA, {
      parseStrings: true,
    }),
    prepareHeapSnapshot(pathB, {
      parseStrings: true,
    }),
  ])
  return []
}
