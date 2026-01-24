import { SourceMapConsumer } from 'source-map'

export const getOriginalPositions = async (
  sourceMap: any,
  value: readonly number[],
  classNames: boolean,
  hash: string,
  key: string,
): Promise<readonly any[]> => {
  const positions: any[] = []

  for (let i = 0; i < value.length; i += 2) {
    const line = value[i]
    const column = value[i + 1]

    try {
      const originalPosition = await sourceMap.originalPositionFor({
        line,
        column,
      })

      if (originalPosition) {
        positions.push({
          line: originalPosition.line,
          column: originalPosition.column,
          name: originalPosition.name,
          source: originalPosition.source,
          sourcesHash: hash,
        })
      } else {
        positions.push(null)
      }
    } catch (error) {
      positions.push(null)
    }
  }

  return positions
}
