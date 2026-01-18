let currentElectronRpc: any = undefined
let currentMonkeyPatchedElectronId: string | undefined = undefined

export const setElectronRpc = (electronRpc: any, monkeyPatchedElectronId: string): void => {
  currentElectronRpc = electronRpc
  currentMonkeyPatchedElectronId = monkeyPatchedElectronId
}

export const getElectronRpc = (): { electronRpc: any; monkeyPatchedElectronId: string } | undefined => {
  if (currentElectronRpc && currentMonkeyPatchedElectronId) {
    return {
      electronRpc: currentElectronRpc,
      monkeyPatchedElectronId: currentMonkeyPatchedElectronId,
    }
  }
  return undefined
}

export const clearElectronRpc = (): void => {
  currentElectronRpc = undefined
  currentMonkeyPatchedElectronId = undefined
}
