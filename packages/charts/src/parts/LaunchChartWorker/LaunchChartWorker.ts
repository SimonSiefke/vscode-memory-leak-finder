import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const launchChartWorker = async () => {
  const chartWorkerPath = join(Root.root, 'packages', 'chart-worker', 'src', 'main.ts')
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    // @ts-ignore
    name: 'Chart Worker',
    path: chartWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke: rpc.invoke,
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
