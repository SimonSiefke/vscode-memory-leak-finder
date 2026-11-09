import type { ElectronContext } from '../src/types.ts'

export const setup = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.setupApiSession()')
}

export const run = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.protocolHandleFetchUnhandle()')
}
