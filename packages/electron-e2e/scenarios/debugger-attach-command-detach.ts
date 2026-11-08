import type { ElectronContext } from '../src/types.ts'

export const setup = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.setupApiHost()')
}

export const run = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.debuggerAttachCommandDetach()')
}

export const teardown = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.teardownApiHost()')
}
