import { join, resolve } from 'node:path'
import type { RawSourceMap } from 'source-map'
import { SourceMapConsumer } from 'source-map'
import * as AddOriginalPositions from '../AddOriginalPositions/AddOriginalPositions.ts'
import * as Assert from '../Assert/Assert.ts'
<<<<<<< HEAD
import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
=======
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'
>>>>>>> origin/main
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
<<<<<<< HEAD
  const intermediateItems: IntermediateItem[] = await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
    const items: IntermediateItem[] = []
=======
  await using originalNameWorker = await OriginalNameWorker.create()
  const originalPositions = await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
    const originalPositions: OriginalPosition[] = []
>>>>>>> origin/main
    for (let i = 0; i < positions.length; i += 2) {
      const line: number = positions[i]
      const column: number = positions[i + 1]
      const originalPosition = consumer.originalPositionFor({
        column: column + 1,
        line: line + 1,
      })
      let codePath: string | null = null
      let needsOriginalName = false
      if (classNames && originalPosition.source && originalPosition.line !== null && originalPosition.column !== null) {
        const index: number = sourceMap.sources.indexOf(originalPosition.source)
        if (index !== -1) {
          const sourceFileRelativePath: string = sourceMap.sources[index]
<<<<<<< HEAD
          codePath = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
          needsOriginalName = true
=======
          const originalCodePath: string = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
          const originalClassName: string = await originalNameWorker.invoke(
            'OriginalName.getOriginalNameFromFile',
            originalCodePath,
            originalPosition.line,
            originalPosition.column,
          )
          originalPosition.name = originalClassName
>>>>>>> origin/main
        }
      }
      items.push({
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
<<<<<<< HEAD

  const finalResults: readonly OriginalPosition[] = await AddOriginalPositions.addOriginalPositions(intermediateItems)

  return finalResults
=======
  // TODO add original names here, and cache computations
  return originalPositions
>>>>>>> origin/main
}
