import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames, resolveExtensionSourceMaps) => {
  await using rpc = await LaunchSourceMapWorker.launchSourceMapCoordinator(resolveExtensionSourceMaps)
  const response = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  return response
}
