import type { FunctionStatistics } from '../Types/Types.ts'

let currentSessionRpc: any = undefined

export const setSessionRpc = (sessionRpc: any): void => {
  currentSessionRpc = sessionRpc
}

export const getFunctionStatistics = async (): Promise<FunctionStatistics> => {
  if (!currentSessionRpc) {
    throw new Error('Function tracker not connected. Call connectDevtools first.')
  }
  const result = await currentSessionRpc.invoke('Runtime.evaluate', {
    expression: `
      (function() {
        if (typeof globalThis.getFunctionStatistics === 'function') {
          return globalThis.getFunctionStatistics();
        }
        return {};
      })()
    `,
    returnByValue: true,
  })
  if (result.result && result.result.value) {
    return result.result.value
  }
  return {}
}
