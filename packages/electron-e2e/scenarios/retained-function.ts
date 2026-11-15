import type { ElectronContext } from '../src/types.ts'

// Deliberately leaks one named function per run to verify the measurement target.
export const run = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.retainFunction()')
}
