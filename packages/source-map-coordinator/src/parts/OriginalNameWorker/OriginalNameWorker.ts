import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getOriginalNameWorkerPath } from '../OriginalNameWorkerPath/OriginalNameWorkerPath.ts'

export const create = async () => {
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: getOriginalNameWorkerPath(),
  })
  return {
    invoke(method: string, ...params: readonly any[]): Promise<any> {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose]() {
      await rpc.dispose()
    },
  }
}
