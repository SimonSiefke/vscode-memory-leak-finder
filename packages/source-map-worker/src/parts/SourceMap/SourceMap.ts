import { join, resolve } from 'node:path'
import type { RawSourceMap } from 'source-map'
import { SourceMapConsumer } from 'source-map'
import * as AddOriginalPositions from '../AddOriginalPositions/AddOriginalPositions.ts'
import * as Assert from '../Assert/Assert.ts'
import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'
import { root } from '../Root/Root.ts'

export const getOriginalPositions = async (
  sourceMap: RawSourceMap,
  positions: number[],
  classNames: boolean,
  hash: string,
): Promise<readonly OriginalPosition[]> => {
  Assert.object(sourceMap)
  Assert.array(positions)
  const intermediateItems: IntermediateItem[] = []
  await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
    for (let i = 0; i < positions.length; i += 2) {
      const line: number = positions[i]
      const column: number = positions[i + 1]
      const originalPosition = consumer.originalPositionFor({
        column: column + 1,
        line: line + 1,
      })
      let codePath: string | null = null
      let needsOriginalName = false
      intermediateItems.push({
        line: originalPosition.line,
        column: originalPosition.column,
        codePath,
        name: originalPosition.name,
        needsOriginalName,
        source: originalPosition.source,
      })
    }
    return items
  })

  const finalResults: readonly OriginalPosition[] = await AddOriginalPositions.addOriginalPositions(intermediateItems)

  return finalResults
}
