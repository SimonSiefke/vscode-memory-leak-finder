import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

const loadSourceMapWorkerPath: string = join(Root.root, 'packages', 'load-source-map-worker', 'src', 'loadSourceMapWorkerMain.ts')

export const launchLoadSourceMapsWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: loadSourceMapWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: any[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
