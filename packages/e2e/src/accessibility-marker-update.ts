import { command, expectSignal, waitFor } from '../helpers/accessibilityMarkerSignals.ts'
import type { TestContext } from '../types.ts'

// Requires --enable-extensions for the deterministic diagnostic provider.
export const skip = 1

export { setup, teardown } from '../helpers/accessibilityMarkerSignals.ts'

export const run = async (context: TestContext): Promise<void> => {
  await context.Editor.setCursor(4, 2)
  await expectSignal(context, 'Warning')
  await command(context, 'clear')
  await waitFor(context, "document.querySelectorAll('.monaco-editor .squiggly-error, .monaco-editor .squiggly-warning').length === 0")
  await context.Editor.setCursor(2, 2)
  // The cursor remains here: the diagnostic change must drive the announcement.
  await command(context, 'publish')
  await expectSignal(context, 'Error')
  await waitFor(context, "document.querySelectorAll('.monaco-editor .squiggly-error').length > 0")
}
