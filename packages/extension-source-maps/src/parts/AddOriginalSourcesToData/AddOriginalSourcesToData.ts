import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { VError } from '@lvce-editor/verror'
import * as Root from '../Root/Root.ts'
import * as CollectSourceMapPositions from '../CollectSourceMapPositions/CollectSourceMapPositions.ts'
import * as ExtractItemsFromData from '../ExtractItemsFromData/ExtractItemsFromData.ts'
import * as ResolveOriginalPositions from '../ResolveOriginalPositions/ResolveOriginalPositions.ts'

export const addOriginalSourcesToData = async (dataFilePath: string, version: string, outputFilePath: string): Promise<void> => {
  try {
    const rootPath = Root.root
    const dataContent = await readFile(dataFilePath, 'utf8')
    const data = JSON.parse(dataContent)
    const items = ExtractItemsFromData.extractItemsFromData(data)

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

    await ResolveOriginalPositions.resolveOriginalPositions(enriched, sourceMapUrlToPositions, positionPointers)

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
