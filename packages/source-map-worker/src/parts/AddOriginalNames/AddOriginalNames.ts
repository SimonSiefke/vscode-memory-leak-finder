import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'

const getOriginalNames = async (items: readonly IntermediateItem[], constructorNames: boolean): Promise<readonly string[]> => {
  await using rpc = await OriginalNameWorker.create()
  const command = constructorNames ? 'OriginalName.getOriginalConstructorNameFromFiles' : 'OriginalName.getOriginalNameFromFiles'
  const rpcItems = constructorNames
    ? items.map((item) => ({
        ...item,
        line: item.line === null ? null : item.line - 1,
      }))
    : items
  const originalNames = await rpc.invoke(command, rpcItems)
  return originalNames
}

export const addOriginalNames = async (
  intermediateItems: readonly IntermediateItem[],
  constructorNames = false,
): Promise<readonly OriginalPosition[]> => {
  const names = await getOriginalNames(intermediateItems, constructorNames)
  const finalResults: OriginalPosition[] = []
  for (let i = 0; i < intermediateItems.length; i++) {
    const item = intermediateItems[i]
    const originalName = names[i]
    finalResults.push({
      column: item.column,
      line: item.line,
      name: originalName || (constructorNames ? '' : item.name) || '',
      source: item.source,
      sourcesHash: item.sourcesHash,
    })
  }
  return finalResults
}
