import { command, moveToMarker, expectSignal, waitFor } from '../helpers/accessibilityMarkerSignals.ts'
import type { TestContext } from '../types.ts'

// Requires --enable-extensions for the deterministic diagnostic provider.
export const skip = 1

export { setup, teardown } from '../helpers/accessibilityMarkerSignals.ts'

export const run = async (context: TestContext): Promise<void> => {
  await moveToMarker(context, 4)
  await expectSignal(context, 'Warning')
  await command(context, 'update', async () => {
    await waitFor(context, "document.querySelectorAll('.monaco-editor .squiggly-error, .monaco-editor .squiggly-warning').length === 0")
    await waitFor(context, "document.getElementById('status.editor.selection')?.textContent?.includes('Ln 2, Col 2')")
  })
  await expectSignal(context, 'Error')
  await waitFor(context, "document.querySelectorAll('.monaco-editor .squiggly-error').length > 0")
}
