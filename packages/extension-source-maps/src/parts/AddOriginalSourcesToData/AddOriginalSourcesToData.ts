import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VError } from '@lvce-editor/verror'
import * as Root from '../Root/Root.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
import * as CollectSourceMapPositions from '../CollectSourceMapPositions/CollectSourceMapPositions.ts'

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
    const { sourceMapUrlToPositions, positionPointers } = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

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
