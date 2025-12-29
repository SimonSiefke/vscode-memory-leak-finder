import type { LeakedClosureWithReferences } from '../EnrichLeakedClosuresWithReferences/EnrichLeakedClosuresWithReferences.ts'
import type { ReferencePath } from '../ReferencePath/ReferencePath.ts'

export const enrichClosuresWithReferences = (
  leakedClosures: Record<string, Array<{ nodeIndex: number; nodeName: string; nodeId: number }>>,
  referencesMap: Map<number, Array<ReferencePath>>,
): Record<string, LeakedClosureWithReferences[]> => {
  const enriched: Record<string, LeakedClosureWithReferences[]> = {}
  for (const [locationKey, closures] of Object.entries(leakedClosures)) {
    enriched[locationKey] = closures.map((closure) => {
      const references = referencesMap.get(closure.nodeIndex) || []
      const sortedReferences = [...references].sort((a, b) => {
        // Sort by sourceNodeName first
        const sourceNodeNameA = a.sourceNodeName ?? ''
        const sourceNodeNameB = b.sourceNodeName ?? ''
        if (sourceNodeNameA !== sourceNodeNameB) {
          return sourceNodeNameA.localeCompare(sourceNodeNameB)
        }
        // Then sort by path
        return a.path.localeCompare(b.path)
      })
      return {
        nodeName: closure.nodeName,
        references: sortedReferences,
      }
    })
  }
  return enriched
}
