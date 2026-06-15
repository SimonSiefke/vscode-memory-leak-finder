import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import { root } from '../Root/Root.ts'

const getRepositoryWorkerPath = () => {
  return join(root, 'packages', 'repository-worker', 'bin', 'repository-worker.js')
}

export const launch = async () => {
  const path = getRepositoryWorkerPath()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    execArgv: [],
    path,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: unknown[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
