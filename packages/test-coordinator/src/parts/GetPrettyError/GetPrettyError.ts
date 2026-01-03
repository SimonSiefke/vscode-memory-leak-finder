import * as GetErrorWorkerRpc from '../GetErrorWorkerRpc/GetErrorWorkerRpc.ts'

export const getPrettyError = async (error: unknown, color: boolean, root: string): Promise<unknown> => {
  await using errorWorkerRpc = await GetErrorWorkerRpc.getErrorWorkerRpc()
  const prettyError = await errorWorkerRpc.invoke('PrettyError.prepare', error, { color, root })
  return prettyError
}
