import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

<<<<<<< HEAD
export const getCleanPositionsMap = async (sourceMapUrlMap, classNames, resolveExtensionSourceMaps) => {
  await using rpc = await LaunchSourceMapWorker.launchSourceMapCoordinator(resolveExtensionSourceMaps)
=======
export const getCleanPositionsMap = async (sourceMapUrlMap, classNames) => {
  await using rpc = await LaunchSourceMapWorker.launchSourceMapCoordinator()
>>>>>>> origin/main
  const response = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  return response
}
