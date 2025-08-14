import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const sourceMapWorkerPath = join(Root.root, 'packages', 'source-map-worker', 'src', 'sourceMapWorkerMain.ts')

export const getCleanPositionsMap = async (sourceMapUrlMap, classNames) => {
  const rpc = await NodeWorkerRpcParent.create({
    stdio: 'inherit',
    path: sourceMapWorkerPath,
    commandMap: {},
  })
  const response = await rpc.invoke('SourceMap.getCleanPositionsMap', sourceMapUrlMap, classNames)
  await rpc.dispose()
  return response
}
