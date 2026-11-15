export interface MainProcessIdentity {
  readonly pid: number
  readonly type: string
  readonly electron: string
}

export const verifyMainProcess = (identity: MainProcessIdentity, expectedPid: number | undefined): void => {
  if (!expectedPid || identity.pid !== expectedPid || identity.type !== 'browser' || !identity.electron) {
    throw new Error(`Expected launched Electron main process ${expectedPid}, got ${JSON.stringify(identity)}`)
  }
}
