import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { SourceMapConsumer } from 'source-map'
import * as Assert from '../Assert/Assert.js'
import * as GetOriginalClassName from '../GetOriginalClassName/GetOriginalClassName.js'
import { root } from '../Root/Root.js'

export const getOriginalPosition = async (sourceMap, line, column) => {
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

export const getOriginalPositions = async (sourceMap, positions, classNames, hash) => {
  Assert.object(sourceMap)
  Assert.array(positions)
  const originalPositions = await SourceMapConsumer.with(sourceMap, null, async (consumer) => {
    const originalPositions = []
    for (let i = 0; i < positions.length; i += 2) {
      const line = positions[i]
      const column = positions[i + 1]
      const originalPosition = consumer.originalPositionFor({
        line: line + 1,
        column: column + 1,
      })
      if (classNames && originalPosition.source) {
        const index = sourceMap.sources.indexOf(originalPosition.source)
        if (index !== -1) {
          // TODO maybe compute this separately
          const sourceFileRelativePath = sourceMap.sources[index]
          const originalCodePath = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
          const originalCode = await readFile(originalCodePath, 'utf8')
          const originalClassName = GetOriginalClassName.getOriginalClassName(originalCode, originalPosition.line, originalPosition.column)
          originalPosition.name = originalClassName
        }
      }
      originalPositions.push(originalPosition)
    }
    return originalPositions
  })
  return originalPositions
}
