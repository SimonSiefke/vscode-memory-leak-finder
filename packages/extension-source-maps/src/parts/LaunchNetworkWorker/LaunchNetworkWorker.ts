import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

const getNetworkWorkerUrl = (): string => {
  const url = join(root, 'packages/network-worker/src/main.ts')
  return url
}

export const launchNetworkWorker = async () => {
  const url = getNetworkWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path: url,
    stdio: 'inherit',
  })
  return {
    invoke: rpc.invoke.bind(rpc),
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}

