import * as TestNameState from '../TestNameState/TestNameState.ts'
import * as ProxyWorkerState from '../ProxyWorkerState/ProxyWorkerState.ts'

export const setTestName = async (testName: string | null): Promise<void> => {
  TestNameState.setTestName(testName)
  // Also set it in proxy worker if it's already created
  const proxyWorkerRpc = ProxyWorkerState.getProxyWorkerRpc()
  if (proxyWorkerRpc) {
    try {
      await proxyWorkerRpc.invoke('Proxy.setCurrentTestName', testName)
    } catch (error) {
      // Ignore errors
    }
  }
}
