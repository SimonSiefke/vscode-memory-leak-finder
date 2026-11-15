import type { ElectronContext } from '../src/types.ts'

// Positive control: one touched MiB of native Buffer storage retained per cycle.
export const run = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.retainNativeBuffer()')
}
