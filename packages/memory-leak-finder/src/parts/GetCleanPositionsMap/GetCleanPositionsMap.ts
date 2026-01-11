import * as LaunchSourceMapWorker from '../LaunchSourceMapWorker/LaunchSourceMapWorker.ts'

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames) => {
  await using rpc = await LaunchSourceMapWorker.launchSourceMapWorker()
  const response = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  return response
}
