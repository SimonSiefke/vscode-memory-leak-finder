import { command, expectSignal } from '../helpers/accessibilityMarkerSignals.ts'
import type { TestContext } from '../types.ts'

// Requires --enable-extensions for the deterministic diagnostic provider.
export const skip = 1

export { setup, teardown } from '../helpers/accessibilityMarkerSignals.ts'

export const run = async (context: TestContext): Promise<void> => {
  await command(context, 'restore')
  await context.Editor.setCursor(4, 2)
  await expectSignal(context, 'Warning')
  await context.Editor.setCursor(2, 2)
  await expectSignal(context, 'Error')
}
