import type { RawSourceMap } from 'source-map'
import { SourceMapConsumer } from 'source-map'
import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'
import * as AddOriginalPositions from '../AddOriginalPositions/AddOriginalPositions.ts'
import * as Assert from '../Assert/Assert.ts'

export const getOriginalPositions = async (
  sourceMap: RawSourceMap,
  positions: number[],
  classNames: boolean,
  hash: string,
): Promise<readonly OriginalPosition[]> => {
  Assert.object(sourceMap)
  Assert.array(positions)
  const intermediateItems = await SourceMapConsumer.with<readonly IntermediateItem[]>(sourceMap, null, async (consumer) => {
    const intermediateItems: IntermediateItem[] = []
    for (let i = 0; i < positions.length; i += 2) {
      const line: number = positions[i]
      const column: number = positions[i + 1]
      const originalPosition = consumer.originalPositionFor({
        column: column + 1,
        line: line + 1,
      })
      const codePath: string | null = null
      const needsOriginalName = false
      intermediateItems.push({
        codePath,
        column: originalPosition.column,
        line: originalPosition.line,
        name: originalPosition.name,
        needsOriginalName,
        source: originalPosition.source,
      })
    }
    return intermediateItems
  })

  const finalResults: readonly OriginalPosition[] = await AddOriginalPositions.addOriginalPositions(intermediateItems)

  return finalResults
}
