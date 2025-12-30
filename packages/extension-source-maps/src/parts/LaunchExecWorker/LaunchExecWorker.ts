import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

const getExecWorkerUrl = (): string => {
  const url = join(root, 'packages/exec-worker/src/main.ts')
  return url
}

export const launchExecWorker = async () => {
  const url = getExecWorkerUrl()
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
