let proxyWorkerRpc: { invoke: (method: string, ...params: unknown[]) => Promise<unknown> } | null = null

export const setProxyWorkerRpc = (rpc: { invoke: (method: string, ...params: unknown[]) => Promise<unknown> } | null): void => {
  proxyWorkerRpc = rpc
}

export const getProxyWorkerRpc = (): { invoke: (method: string, ...params: unknown[]) => Promise<unknown> } | null => {
  return proxyWorkerRpc
}
