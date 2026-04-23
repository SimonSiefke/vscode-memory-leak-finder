export interface PendingDevtoolsConnectionOptions {
  readonly attachedToPageTimeout: number
  readonly devtoolsWebSocketUrl: string
  readonly electronWebSocketUrl: string
  readonly externalInspectPort?: number
  readonly externalInspectRuntime?: 'bun' | 'node'
  readonly inspectExtensions: boolean
  readonly inspectExtensionsPort: number
  readonly inspectPtyHost: boolean
  readonly inspectPtyHostPort: number
  readonly inspectSharedProcess: boolean
  readonly inspectSharedProcessPort: number
  readonly measureId: string
  readonly measureNode: boolean
  readonly pid: number
}

const state: Record<number, PendingDevtoolsConnectionOptions> = Object.create(null)

export const set = (connectionId: number, value: PendingDevtoolsConnectionOptions): void => {
  state[connectionId] = value
}

export const get = (connectionId: number): PendingDevtoolsConnectionOptions | undefined => {
  return state[connectionId]
}

export const remove = (connectionId: number): void => {
  delete state[connectionId]
}
