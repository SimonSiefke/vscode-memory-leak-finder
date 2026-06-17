import * as GetEventListenerOriginalSourcesCached from '../GetEventListenerOriginalSourcesCached/GetEventListenerOriginalSourcesCached.ts'
import * as GetEventListenersQuery from '../GetEventListenersQuery/GetEventListenersQuery.ts'

type DetachedDomNode = {
  readonly stackTrace: readonly unknown[]
  readonly [key: string]: unknown
}

type CleanInstance = {
  readonly originalIndex: number
  readonly originalStack?: readonly unknown[]
  readonly sourcesHash?: string | null
  readonly [key: string]: unknown
}

const mergeOriginal = (nodes: readonly DetachedDomNode[], cleanInstances: readonly CleanInstance[]): readonly DetachedDomNode[] => {
  const reverseMap = Object.create(null)
  for (const instance of cleanInstances) {
    reverseMap[instance.originalIndex] = instance
  }
  const merged: any[] = []
  let originalIndex = 0
  for (const node of nodes) {
    originalIndex++
    const originalStack: any[] = []
    let sourcesHash: string | null | undefined = null
    for (let i = 0; i < node.stackTrace.length; i++) {
      originalIndex++
      const instance = reverseMap[originalIndex]
      if (instance && instance.originalStack) {
        originalStack.push(instance.originalStack[0])
        if (i === 0 && instance.sourcesHash) {
          sourcesHash = instance.sourcesHash
        }
      }
    }
    merged.push({
      ...node,
      originalStack,
      sourcesHash,
    })
  }
  return merged
}

export const cleanDetachedDomNodesWithStackTraces = async (nodes: readonly DetachedDomNode[], scriptMap: unknown): Promise<readonly DetachedDomNode[]> => {
  const stackTraces = nodes.map((node: DetachedDomNode) => node.stackTrace)
  const fullQuery = GetEventListenersQuery.getEventListenerQuery(stackTraces, scriptMap)
  const cleanInstances = await GetEventListenerOriginalSourcesCached.getEventListenerOriginalSourcesCached(fullQuery, false)
  const sorted = mergeOriginal(nodes, cleanInstances)
  return sorted
}
