import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const sourceMapWorkerPath = join(Root.root, 'packages', 'source-map-worker', 'src', 'sourceMapWorkerMain.ts')

const launchSourceMapWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    stdio: 'inherit',
    path: sourceMapWorkerPath,
    commandMap: {},
  })
  return {
    invoke(method, ...params) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames) => {
  await using rpc = await launchSourceMapWorker()
  const response = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  return response
}
