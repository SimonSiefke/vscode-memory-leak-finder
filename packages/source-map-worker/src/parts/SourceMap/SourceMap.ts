import type { RawSourceMap } from 'source-map'
import { readFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { SourceMapConsumer } from 'source-map'
import * as Assert from '../Assert/Assert.ts'
import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'
import * as OriginalNameWorker from '../OriginalNameWorker/OriginalNameWorker.ts'
import { root } from '../Root/Root.ts'

interface OriginalPosition {
  source: string | null
  line: number | null
  column: number | null
  name: string | null
}

export const getOriginalPositions = async (
  sourceMap: RawSourceMap,
  positions: number[],
  classNames: boolean,
  hash: string,
): Promise<OriginalPosition[]> => {
  Assert.object(sourceMap)
  Assert.array(positions)
  const originalPositions = await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
    const originalPositions: OriginalPosition[] = []
    for (let i = 0; i < positions.length; i += 2) {
      const line: number = positions[i]
      const column: number = positions[i + 1]
      const originalPosition = consumer.originalPositionFor({
        line: line + 1,
        column: column + 1,
      })
      if (classNames && originalPosition.source && originalPosition.line !== null && originalPosition.column !== null) {
        const index: number = sourceMap.sources.indexOf(originalPosition.source)
        if (index !== -1) {
          // TODO maybe compute this separately
          const sourceFileRelativePath: string = sourceMap.sources[index]
          const originalCodePath: string = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
          const originalClassName: string = await GetOriginalClassName.getOriginalClassNameFromFile(
            originalCodePath,
            originalPosition.line,
            originalPosition.column,
          )
          originalPosition.name = originalClassName
        }
      }
      originalPositions.push(originalPosition)
    }
    return originalPositions
  })

  // TODO add original names here, and cache computations
  await OriginalNameWorker.dispose()
  return originalPositions
}
