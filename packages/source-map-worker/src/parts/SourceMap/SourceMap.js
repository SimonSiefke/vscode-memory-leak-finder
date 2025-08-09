import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { SourceMapConsumer } from 'source-map'
import * as Assert from '../Assert/Assert.ts'
import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.ts'
import { root } from '../Root/Root.ts'

interface SourceMapData {
  sources: string[]
  [key: string]: any
}

interface OriginalPosition {
  source: string | null
  line: number | null
  column: number | null
  name: string | null
}

export const getOriginalPosition = async (sourceMap: SourceMapData, line: number, column: number): Promise<OriginalPosition> => {
  Assert.object(sourceMap)
  Assert.number(line)
  Assert.number(column)
  const originalPosition = await SourceMapConsumer.with(sourceMap, null, (consumer) => {
    return consumer.originalPositionFor({
      line: line + 1,
      column: column + 1,
    })
  })
  return {
    source: originalPosition.source,
    line: originalPosition.line,
    column: originalPosition.column,
    name: originalPosition.name,
  }
}

export const getOriginalPositions = async (sourceMap: SourceMapData, positions: number[], classNames: boolean, hash: string): Promise<OriginalPosition[]> => {
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
      if (classNames && originalPosition.source) {
        const index: number = sourceMap.sources.indexOf(originalPosition.source)
        if (index !== -1) {
          // TODO maybe compute this separately
          const sourceFileRelativePath: string = sourceMap.sources[index]
          const originalCodePath: string = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
          const originalCode: string = await readFile(originalCodePath, 'utf8')
          const originalClassName: string = GetOriginalClassName.getOriginalClassName(originalCode, originalPosition.line, originalPosition.column)
          originalPosition.name = originalClassName
        }
      }
      originalPositions.push(originalPosition)
    }
    return originalPositions
  })
  return originalPositions
}
