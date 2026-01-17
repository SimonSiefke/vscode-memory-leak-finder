let currentSessionRpc: any = undefined

export const setSessionRpc = (sessionRpc: any): void => {
  currentSessionRpc = sessionRpc
}

export const getSessionRpc = () => {
  return currentSessionRpc
}
