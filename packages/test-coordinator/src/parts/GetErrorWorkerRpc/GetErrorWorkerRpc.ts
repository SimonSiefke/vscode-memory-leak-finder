import * as LaunchErrorWorker from '../LaunchErrorWorker/LaunchErrorWorker.ts'

export const getErrorWorkerRpc = async () => {
  const rpc = await LaunchErrorWorker.launchErrorWorker()
  return {
    invoke(method: string, ...params: unknown[]): Promise<unknown> {
      return rpc.invoke(method, ...params)
    },
    async [Symbol.asyncDispose](): Promise<void> {
      await rpc.dispose()
    },
  }
}

