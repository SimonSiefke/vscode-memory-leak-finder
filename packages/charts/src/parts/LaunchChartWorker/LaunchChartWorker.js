import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'path'
import * as Root from '../Root/Root.js'

export const launchChartWorker = async () => {
  const chartWorkerPath = join(Root.root, 'packages', 'chart-worker', 'src', 'main.ts')
  const rpc = await NodeWorkerRpcParent.create({
    path: chartWorkerPath,
    // @ts-ignore
    name: 'Chart Worker',
    commandMap: {},
    stdio: 'inherit',
  })
  return {
    invoke: rpc.invoke,
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
