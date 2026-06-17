import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'

const getOriginalNames = async (items: readonly IntermediateItem[]): Promise<readonly string[]> => {
  await using rpc = await OriginalNameWorker.create()
  const originalNames = await rpc.invoke('OriginalName.getOriginalNameFromFiles', items)
  return originalNames
}

export const addOriginalNames = async (intermediateItems: readonly IntermediateItem[]): Promise<readonly OriginalPosition[]> => {
  const names = await getOriginalNames(intermediateItems)
  const finalResults: OriginalPosition[] = []
  for (let i = 0; i < intermediateItems.length; i++) {
    const item = intermediateItems[i]
    const originalName = names[i]
    finalResults.push({
      column: item.column,
      line: item.line,
      name: originalName || item.name || '',
      source: item.source,
      sourcesHash: item.sourcesHash,
    })
  }
  return finalResults
}
