import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'

// TODO rename to addoriginalNames
export const addOriginalPositions = async (intermediateItems: readonly IntermediateItem[]): Promise<readonly OriginalPosition[]> => {
  const rpc = await OriginalNameWorker.create()
  const finalResults: OriginalPosition[] = []
  for (const item of intermediateItems) {
    if (item.needsOriginalName && item.codePath && item.line !== null && item.column !== null) {
      const originalName: string = await rpc.invoke('OriginalName.getOriginalNameFromFile', item.codePath, item.line, item.column)
      finalResults.push({
        line: item.line,
        column: item.column,
        name: originalName || null,
        source: item.source,
      })
    } else {
      finalResults.push({
        line: item.line,
        column: item.column,
        name: item.name,
        source: item.source,
      })
    }
  }
  await rpc.dispose()
  return finalResults
}
