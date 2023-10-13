import { SourceMapConsumer } from 'source-map'
import * as Assert from '../Assert/Assert.js'

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

export const getOriginalPositions = async (sourceMap, positions) => {
  Assert.object(sourceMap)
  Assert.array(positions)
  const originalPositions = await SourceMapConsumer.with(sourceMap, null, (consumer) => {
    const originalPositions = []
    for (const position of positions) {
      originalPositions.push(
        consumer.originalPositionFor({
          line: position.line + 1,
          column: position.column + 1,
        }),
      )
    }
    return originalPositions
  })
  return originalPositions
}
