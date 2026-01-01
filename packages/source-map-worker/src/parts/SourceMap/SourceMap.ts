import type { RawSourceMap } from 'source-map'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SourceMapConsumer } from 'source-map'
import type { IntermediateItem } from '../IntermediateItem/IntermediateItem.ts'
import type { OriginalPosition } from '../OriginalPosition/OriginalPosition.ts'
import * as AddOriginalPositions from '../AddOriginalPositions/AddOriginalPositions.ts'
import * as Assert from '../Assert/Assert.ts'
import { root } from '../Root/Root.ts'

const getExtensionSourceMapDir = (sourceMapUrl: string): string | null => {
  if (!sourceMapUrl.includes('.extension-source-maps-cache')) {
    return null
  }
  try {
    const sourceMapPath = fileURLToPath(sourceMapUrl)
    // Get the directory containing the source map file
    // This allows relative paths in the source map to resolve correctly
    return dirname(sourceMapPath)
  } catch {
    return null
  }
}

export const getOriginalPositions = async (
  sourceMap: RawSourceMap,
  positions: number[],
  classNames: boolean,
  hash: string,
  sourceMapUrl?: string,
): Promise<readonly OriginalPosition[]> => {
  Assert.object(sourceMap)
  Assert.array(positions)
  const extensionSourceMapDir = sourceMapUrl ? getExtensionSourceMapDir(sourceMapUrl) : null
  const intermediateItems = await SourceMapConsumer.with<readonly IntermediateItem[]>(sourceMap, null, async (consumer) => {
    const intermediateItems: IntermediateItem[] = []
    for (let i = 0; i < positions.length; i += 2) {
      const line: number = positions[i]
      const column: number = positions[i + 1]
      const originalPosition = consumer.originalPositionFor({
        column: column + 1,
        line: line + 1,
      })
      let codePath: string | null = null
      if (classNames && originalPosition.source && originalPosition.line !== null && originalPosition.column !== null) {
        const index: number = sourceMap.sources.indexOf(originalPosition.source)
        if (index !== -1) {
          const sourceFileRelativePath: string = sourceMap.sources[index]
          if (extensionSourceMapDir) {
            // For extension source maps, resolve relative to the source map file's directory
            // This allows relative paths like ../src/... to resolve correctly
            codePath = resolve(extensionSourceMapDir, sourceFileRelativePath)
          } else {
            // For regular VS Code source maps, use .vscode-sources
            codePath = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
          }
        }
      }
      intermediateItems.push({
        codePath,
        column: originalPosition.column,
        line: originalPosition.line,
        name: originalPosition.name,
        source: originalPosition.source,
      })
    }
    return intermediateItems
  })

  const finalResults: readonly OriginalPosition[] = await AddOriginalPositions.addOriginalPositions(intermediateItems)

  return finalResults
}
