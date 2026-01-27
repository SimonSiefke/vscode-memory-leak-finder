import * as GetCleanPosition from '../GetCleanPosition/GetCleanPosition.ts'
import * as Hash from '../Hash/Hash.ts'
import * as LoadSourceMap from '../LoadSourceMap/LoadSourceMap.ts'

// const getExtensionSourceMapDir = (sourceMapUrl: string): string | null => {
//   if (!sourceMapUrl.includes('.extension-source-maps-cache')) {
//     return null
//   }
//   try {
//     const sourceMapPath = fileURLToPath(sourceMapUrl)
//     // Get the directory containing the source map file
//     // This allows relative paths in the source map to resolve correctly
//     return dirname(sourceMapPath)
//   } catch {
//     return null
//   }
// }

export const getOriginalPositions = async (sourceMapWorker: any, key: string, value: readonly number[], classNames: boolean) => {
  const hash = Hash.hash(key)
  const sourceMap = await LoadSourceMap.loadSourceMap(key, hash)
  // const extensionSourceMapDir = key ? getExtensionSourceMapDir(key) : null

  const originalPositions = await sourceMapWorker.invoke('SourceMap.getCleanPositionsMap2', sourceMap, value, classNames, hash, key)
  // const enhanced1 = originalPositions.map((originalPosition: any) => {
  //   let codePath: string | null = null
  //   if (classNames && originalPosition.source && originalPosition.line !== null && originalPosition.column !== null) {
  //     const index: number = sourceMap.sources.indexOf(originalPosition.source)
  //     if (index !== -1) {
  //       const sourceFileRelativePath: string = sourceMap.sources[index]
  //       if (extensionSourceMapDir) {
  //         // For extension source maps, resolve relative to the source map file's directory
  //         // This allows relative paths like ../src/... to resolve correctly
  //         codePath = resolve(extensionSourceMapDir, sourceFileRelativePath)
  //       } else {
  //         // For regular VS Code source maps, use .vscode-sources
  //         codePath = resolve(join(root, '.vscode-sources', hash, sourceFileRelativePath))
  //       }
  //     }
  //   }
  //   return {
  //     ...originalPosition,
  //     codePath,
  //   }
  // })

  // TODO add original sources here instead of in sourceMapWorker
  const cleanPositions = originalPositions.map(GetCleanPosition.getCleanPosition)
  return cleanPositions
}
