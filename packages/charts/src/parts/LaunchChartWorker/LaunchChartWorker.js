import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'path'
import * as Root from '../Root/Root.js'

export const launchChartWorker = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    path: join(Root.root, 'packages', 'chart-worker', 'src', 'main.js'),
    // @ts-ignore
    name: 'Chart Worker',
    commandMap: {},
  })
  return {
    invoke: rpc.invoke,
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
