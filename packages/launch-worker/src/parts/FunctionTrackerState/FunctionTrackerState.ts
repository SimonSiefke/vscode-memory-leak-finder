let currentFunctionTrackerRpc: any = undefined

export const setFunctionTrackerRpc = (functionTrackerRpc: any): void => {
  currentFunctionTrackerRpc = functionTrackerRpc
}

export const getFunctionTrackerRpc = (): any => {
  return currentFunctionTrackerRpc
}

export const clearFunctionTrackerRpc = (): void => {
  currentFunctionTrackerRpc = undefined
}
