import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const getExecWorkerUrl = (): string => {
  const thisDir = fileURLToPath(import.meta.url)
  const packageDir = join(thisDir, '../../..')
  const root = join(packageDir, '../..')
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
