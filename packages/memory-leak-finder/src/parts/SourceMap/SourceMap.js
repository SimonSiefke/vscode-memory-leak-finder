import { SourceMapConsumer } from 'source-map'
import * as Assert from '../Assert/Assert.js'

export const getOriginalPosition = async (sourceMap, line, column) => {
  Assert.object(sourceMap)
  Assert.number(line)
  Assert.number(column)
  console.log({ line, column })
  const originalPosition = await SourceMapConsumer.with(sourceMap, null, (consumer) => {
    return consumer.originalPositionFor({
      line: line + 1,
      column: column + 1,
    })
  })
  console.log({ originalPosition })
  return {
    source: originalPosition.source,
    line: originalPosition.line,
    column: originalPosition.column,
    name: originalPosition.name,
  }
}
