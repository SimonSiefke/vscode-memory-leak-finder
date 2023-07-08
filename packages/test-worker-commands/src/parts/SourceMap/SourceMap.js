import { SourceMapConsumer } from 'source-map'
import * as Assert from '../Assert/Assert.js'

export const getOriginalPosition = async (rawSourceMap, line, column) => {
  Assert.object(rawSourceMap)
  Assert.number(line)
  Assert.number(column)
  const originalPosition = await SourceMapConsumer.with(rawSourceMap, null, (consumer) => {
    return consumer.originalPositionFor({
      line,
      column,
    })
  })
  return originalPosition
}
