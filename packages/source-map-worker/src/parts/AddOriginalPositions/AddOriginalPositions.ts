import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'

// TODO rename to addoriginalNames
export const addOriginalPositions = async (intermediateItems: readonly IntermediateItem[]): Promise<readonly OriginalPosition[]> => {
  await using rpc = await OriginalNameWorker.create()
  const finalResults: OriginalPosition[] = []
  for (const item of intermediateItems) {
    if (item.codePath && item.line !== null && item.column !== null) {
      const originalName: string = await rpc.invoke('OriginalName.getOriginalNameFromFile', item.codePath, item.line, item.column)
      finalResults.push({
        column: item.column,
        line: item.line,
        name: originalName || item.name || '',
        source: item.source,
      })
    } else {
      finalResults.push({
        column: item.column,
        line: item.line,
        name: item.name,
        source: item.source,
      })
    }
  }
  return finalResults
}
