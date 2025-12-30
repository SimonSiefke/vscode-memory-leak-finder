import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VError } from '@lvce-editor/verror'
import * as Root from '../Root/Root.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

const mapUrlToSourceMapUrl = (url: string, version: string, root: string): string | null => {
  if (!url) {
    return null
  }
  try {
    const urlObj = new URL(url)
    if (urlObj.protocol !== 'file:') {
      return null
    }
    const path = fileURLToPath(url)
    // Check if this is a copilot extension file
    // Path might be: /path/to/.vscode-extensions/github.copilot-chat-{version}/dist/extension.js
    const extensionId = `github.copilot-chat-${version}`
    const extensionIndex = path.indexOf(`.vscode-extensions/${extensionId}`)
    if (extensionIndex === -1) {
      return null
    }
    // Map to source maps directory
    const relativePath = path.slice(extensionIndex + `.vscode-extensions/${extensionId}`.length)
    const sourceMapPath = join(root, '.extension-source-maps', extensionId, relativePath + '.map')
    const sourceMapUrl = `file://${sourceMapPath}`
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
    
    // Handle both array and object with array property
    let items: readonly any[]
    if (Array.isArray(data)) {
      items = data
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
      const item = enriched[i] as any
      let sourceMapUrl: string | null = null
      
      // Try to get source map URL from item
      if (item.sourceMapUrl) {
        sourceMapUrl = item.sourceMapUrl
      } else if (item.url) {
        // Map URL to source map URL
        sourceMapUrl = mapUrlToSourceMapUrl(item.url, version, rootPath)
        if (sourceMapUrl) {
          item.sourceMapUrl = sourceMapUrl
        }
      }
      
      if (sourceMapUrl && item.line !== undefined && item.column !== undefined) {
        if (!sourceMapUrlToPositions[sourceMapUrl]) {
          sourceMapUrlToPositions[sourceMapUrl] = []
        }
        sourceMapUrlToPositions[sourceMapUrl].push(item.line, item.column)
        positionPointers.push({ index: i, sourceMapUrl: sourceMapUrl })
      }
    }

    const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
    if (sourceMapUrls.length === 0) {
      // No source maps to resolve, just write the data as-is
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
          const target = enriched[pointer.index] as any
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

