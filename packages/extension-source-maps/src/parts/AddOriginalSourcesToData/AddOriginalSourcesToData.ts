import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as Root from '../Root/Root.ts'

const parseSourceLocation = (sourceLocation: string): { url: string; line: number; column: number } | null => {
  if (!sourceLocation) {
    return null
  }
  // Format: ".vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js:917:1277"
  const match = sourceLocation.match(/^(.+):(\d+):(\d+)$/)
  if (!match) {
    return null
  }
  const path = match[1]
  const line = Number.parseInt(match[2], 10)
  const column = Number.parseInt(match[3], 10)
  return { column, line, url: path }
}

const mapPathToSourceMapUrl = (path: string, root: string): string | null => {
  if (!path) {
    return null
  }
  try {
    // Path might be: .vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js
    // or absolute path
    const absolutePath = path.startsWith('/') ? path : resolve(root, path)

    // Check if this is a copilot extension file
    const extensionMatch = absolutePath.match(/\.vscode-extensions\/(github\.copilot-chat-[^/]+)\/(.+)$/)
    if (!extensionMatch) {
      return null
    }
    const extensionId = extensionMatch[1]
    const relativePath = extensionMatch[2]

    // Map to source maps directory
    const sourceMapPath = join(root, '.extension-source-maps', extensionId, relativePath + '.map')
    if (!existsSync(sourceMapPath)) {
      console.log(`[addOriginalSourcesToData] Source map not found: ${sourceMapPath}`)
      return null
    }
    const sourceMapUrl = pathToFileURL(sourceMapPath).toString()
    return sourceMapUrl
  } catch {
    return null
  }
}

export const addOriginalSourcesToData = async (dataFilePath: string, version: string, outputFilePath: string): Promise<void> => {
  try {
    const rootPath = Root.root
    const dataContent = await readFile(dataFilePath, 'utf8')
    const data = JSON.parse(dataContent)

    // Handle both array and object with array property (namedFunctionCount2 or namedFunctionCount3)
    let items: readonly any[]
    if (Array.isArray(data)) {
      items = data
    } else if (data.namedFunctionCount3 && Array.isArray(data.namedFunctionCount3)) {
      items = data.namedFunctionCount3
    } else if (data.namedFunctionCount2 && Array.isArray(data.namedFunctionCount2)) {
      items = data.namedFunctionCount2
    } else {
      items = []
    }

    if (items.length === 0) {
      await writeFile(outputFilePath, JSON.stringify(data, null, 2), 'utf8')
      return
    }

    const enriched: any[] = [...items]
    const sourceMapUrlToPositions: Record<string, number[]> = Object.create(null)
    const positionPointers: { index: number; sourceMapUrl: string }[] = []

    // First pass: collect positions for each source map URL
    for (let i = 0; i < enriched.length; i++) {
      const item = enriched[i]
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
        const parsed = parseSourceLocation(item.sourceLocation)
        if (parsed) {
          line = parsed.line
          column = parsed.column
          sourceMapUrl = mapPathToSourceMapUrl(parsed.url, rootPath)
          if (sourceMapUrl) {
            item.sourceMapUrl = sourceMapUrl
          }
        }
      } else if (item.url) {
        // Map URL to source map URL
        sourceMapUrl = mapPathToSourceMapUrl(item.url, rootPath)
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

    const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
    console.log(`[addOriginalSourcesToData] Found ${sourceMapUrls.length} source map URLs to resolve`)
    if (sourceMapUrls.length === 0) {
      // No source maps to resolve, just write the data as-is
      console.log(`[addOriginalSourcesToData] No source maps found, writing data as-is`)
      await writeFile(outputFilePath, JSON.stringify(data, null, 2), 'utf8')
      return
    }

    // Resolve original positions using source-map-worker
    try {
      await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
      const extendedOriginalNames = true
      const cleanPositionMap = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlToPositions, extendedOriginalNames)
      const offsetMap: Record<string, number> = Object.create(null)
      for (const pointer of positionPointers) {
        const positions = cleanPositionMap[pointer.sourceMapUrl] || []
        const offset = offsetMap[pointer.sourceMapUrl] || 0
        const original = positions[offset]
        offsetMap[pointer.sourceMapUrl] = offset + 1
        if (original) {
          const target = enriched[pointer.index]
          target.originalSource = original.source ?? null
          target.originalUrl = original.source ?? null
          target.originalLine = original.line ?? null
          target.originalColumn = original.column ?? null
          target.originalName = original.name ?? null
          if (target.originalUrl && target.originalLine !== null && target.originalColumn !== null) {
            target.originalLocation = `${target.originalUrl}:${target.originalLine}:${target.originalColumn}`
          }
        }
      }
    } catch (error) {
      console.log({ error })
      // ignore sourcemap resolution errors
    }

    // Write enriched data
    let outputData: any
    if (Array.isArray(data)) {
      outputData = enriched
    } else if (data.namedFunctionCount3) {
      outputData = { ...data, namedFunctionCount3: enriched }
    } else {
      outputData = { ...data, namedFunctionCount2: enriched }
    }

    const outputDir = dirname(outputFilePath)
    await mkdir(outputDir, { recursive: true })
    await writeFile(outputFilePath, JSON.stringify(outputData, null, 2), 'utf8')
  } catch (error) {
    throw new VError(error, `Failed to add original sources to data from '${dataFilePath}'`)
  }
}
