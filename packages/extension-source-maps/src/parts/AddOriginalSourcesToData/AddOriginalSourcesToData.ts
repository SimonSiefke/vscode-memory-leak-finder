import { VError } from '@lvce-editor/verror'
import * as CollectSourceMapPositions from '../CollectSourceMapPositions/CollectSourceMapPositions.ts'
import * as ExtractItemsFromData from '../ExtractItemsFromData/ExtractItemsFromData.ts'
import * as ReadJson from '../ReadJson/ReadJson.ts'
import * as ResolveOriginalPositions from '../ResolveOriginalPositions/ResolveOriginalPositions.ts'
import * as Root from '../Root/Root.ts'
import * as WriteJson from '../WriteJson/WriteJson.ts'

export const addOriginalSourcesToData = async (dataFilePath: string, version: string, outputFilePath: string): Promise<void> => {
  try {
    const rootPath = Root.root
    const data = await ReadJson.readJson(dataFilePath)
    const items = ExtractItemsFromData.extractItemsFromData(data)

    if (items.length === 0) {
      await WriteJson.writeJson(outputFilePath, data)
      return
    }

    const enriched: any[] = [...items]
    const { positionPointers, sourceMapUrlToPositions } = CollectSourceMapPositions.collectSourceMapPositions(enriched, rootPath)

    console.log({ sourceMapUrlToPositions })
    const sourceMapUrls = Object.keys(sourceMapUrlToPositions)
    console.log(`[addOriginalSourcesToData] Found ${sourceMapUrls.length} source map URLs to resolve`)
    if (sourceMapUrls.length === 0) {
      // No source maps to resolve, just write the data as-is
      console.log(`[addOriginalSourcesToData] No source maps found, writing data as-is`)
      await WriteJson.writeJson(outputFilePath, data)
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

    await WriteJson.writeJson(outputFilePath, outputData)
  } catch (error) {
    throw new VError(error, `Failed to add original sources to data from '${dataFilePath}'`)
  }
}
