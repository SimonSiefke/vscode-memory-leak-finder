import type { Dynamic } from '../Types/Types.ts'
import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'
export const getCleanPositionsMap = async (sourceMapUrlMap: Dynamic, classNames: Dynamic, constructorNames = false) => {
  await using rpc = await LaunchSourceMapWorker.launchSourceMapCoordinator()
  const response = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames, constructorNames)
  return response
}
