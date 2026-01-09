import * as ProxyWorkerState from '../ProxyWorkerState/ProxyWorkerState.ts'

export const setProxyCurrentTestName = async (testName: string | null): Promise<void> => {
  const proxyWorkerRpc = ProxyWorkerState.getProxyWorkerRpc()
  if (proxyWorkerRpc) {
    await proxyWorkerRpc.invoke('Proxy.setCurrentTestName', testName)
  }
}
