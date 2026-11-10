import type { ElectronContext } from '../src/types.ts'

// Positive control: keep a renderer and a committed 4 MiB WebGL texture per cycle.
export const run = async ({ evaluate }: ElectronContext): Promise<void> => {
  await evaluate('globalThis.electronE2E.retainGpuTexture()')
}
