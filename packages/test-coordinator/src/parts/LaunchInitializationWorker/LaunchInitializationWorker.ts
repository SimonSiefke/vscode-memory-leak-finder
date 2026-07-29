import { NodeWorkerRpcParent } from '@lvce-editor/rpc'
import { getLaunchWorkerUrl } from '../GetLaunchWorkerUrl/GetLaunchWorkerUrl.ts'
import * as TimeoutConstants from '../TimeoutConstants/TimeoutConstants.ts'

const invokeExitWithTimeout = async (rpc): Promise<void> => {
  let timeoutId
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new Error(`Launch.exit timed out after ${TimeoutConstants.LaunchExit}ms`))
    }, TimeoutConstants.LaunchExit)
  })
  try {
    await Promise.race([rpc.invoke('Launch.exit'), timeoutPromise])
  } finally {
    globalThis.clearTimeout(timeoutId)
  }
}

export const launchInitializationWorker = async () => {
  const url = getLaunchWorkerUrl()
  const rpc = await NodeWorkerRpcParent.create({
    commandMap: {},
    path: url,
    stdio: 'inherit',
  })

  const originalDispose = rpc.dispose.bind(rpc)
  const dispose = async () => {
    try {
      await invokeExitWithTimeout(rpc)
    } finally {
      await originalDispose()
    }
  }
  // @ts-ignore
  rpc.dispose = dispose
  return rpc
}
