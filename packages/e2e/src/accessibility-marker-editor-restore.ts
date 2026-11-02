import { command, moveToMarker, expectSignal, waitFor } from '../helpers/accessibilityMarkerSignals.ts'
import type { TestContext } from '../types.ts'

// Requires --enable-extensions for the deterministic diagnostic provider.
export const skip = 1

export { setup, teardown } from '../helpers/accessibilityMarkerSignals.ts'

export const run = async (context: TestContext): Promise<void> => {
  for (let round = 0; round < 5; round++) {
    await context.Editor.switchToTab('secondary.txt')
    await waitFor(context, "document.getElementById('status.editor.selection')?.textContent?.includes('Ln 4, Col 2')")
    await context.Editor.switchToTab('primary.txt')
    await waitFor(context, "document.getElementById('status.editor.selection')?.textContent?.includes('Ln 2, Col 2')")
  }
  await command(context, 'restore')
  await moveToMarker(context, 4)
  await expectSignal(context, 'Warning')
  await moveToMarker(context, 2)
  await expectSignal(context, 'Error')
}
