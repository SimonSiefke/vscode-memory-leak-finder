import { NodeForkedProcessRpcParent } from '@lvce-editor/rpc'
import * as ChromiumMemoryDumpWorkerPath from '../ChromiumMemoryDumpWorkerPath/ChromiumMemoryDumpWorkerPath.ts'
import { getNodeMajorVersion } from '../GetNodeVersionMajor/GetNodeVersionMajor.ts'
import type { Dynamic } from '../Types/Types.ts'

export async function launchChromiumMemoryDumpWorker() {
  const major = getNodeMajorVersion()
  if (major < 24) {
    throw new Error(`node version 24 or higher is required`)
  }
  const rpc = await NodeForkedProcessRpcParent.create({
    commandMap: {},
    path: ChromiumMemoryDumpWorkerPath.chromiumMemoryDumpWorkerPath,
    stdio: 'inherit',
  })
  return {
    invoke(method: string, ...params: readonly Dynamic[]) {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
