import * as MapPathToSourceMapUrl from '../MapPathToSourceMapUrl/MapPathToSourceMapUrl.ts'
import * as ParseSourceLocation from '../ParseSourceLocation/ParseSourceLocation.ts'

export const collectSourceMapPositions = (
  enriched: any[],
  rootPath: string,
): {
  sourceMapUrlToPositions: Record<string, number[]>
  positionPointers: { index: number; sourceMapUrl: string }[]
} => {
  const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
  const positionPointers: { index: number; sourceMapUrl: string }[] = []

  // First pass: collect positions for each source map URL
  for (let i = 0; i < enriched.length; i++) {
    const item = enriched[i] as any
    let sourceMapUrl: string | null = null
    let line: number | undefined
    let column: number | undefined

    // Try to get source map URL from item
    if (item.sourceMapUrl) {
      sourceMapUrl = item.sourceMapUrl
      line = item.line
      column = item.column
    } else if (item.sourceLocation) {
      // Parse sourceLocation format: ".vscode-extensions/.../file.js:917:1277"
      const parsed = ParseSourceLocation.parseSourceLocation(item.sourceLocation)
      if (parsed) {
        line = parsed.line
        column = parsed.column
        sourceMapUrl = MapPathToSourceMapUrl.mapPathToSourceMapUrl(parsed.url, rootPath)
        if (sourceMapUrl) {
          item.sourceMapUrl = sourceMapUrl
        }
      }
    } else if (item.url) {
      // Map URL to source map URL
      sourceMapUrl = MapPathToSourceMapUrl.mapPathToSourceMapUrl(item.url, rootPath)
      if (sourceMapUrl) {
        item.sourceMapUrl = sourceMapUrl
      }
      line = item.line
      column = item.column
    }

    if (sourceMapUrl && line !== undefined && column !== undefined) {
      if (!sourceMapUrlToPositions[sourceMapUrl]) {
        sourceMapUrlToPositions[sourceMapUrl] = []
      }
      sourceMapUrlToPositions[sourceMapUrl].push(line, column)
      positionPointers.push({ index: i, sourceMapUrl: sourceMapUrl })
    }
  }

  return { sourceMapUrlToPositions, positionPointers }
}

