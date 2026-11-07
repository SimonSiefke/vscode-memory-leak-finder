import * as Snapshots from '../helpers/editTelemetrySnapshots.ts'
import type { TestContext } from '../types.ts'

// Requires unbundled VS Code modules and usage telemetry (local logging in OSS
// development builds). See docs/scenarios/edit-telemetry-document-snapshots.md.
export const skip = 1

let iteration = 0

export const setup = async (context: TestContext): Promise<void> => {
  iteration = 0
  try {
    await context.Editor.closeAll()
    await context.Workspace.setFiles([
      { name: 'snapshot-editing.txt', content: 'A substantial document for edit telemetry.\n'.repeat(3000) },
      {
        name: '.vscode/settings.json',
        content: JSON.stringify({ 'editor.quickSuggestions': false, 'editor.wordBasedSuggestions': 'off', 'files.autoSave': 'off' }),
      },
    ])
    await Snapshots.install(context)
    await context.Editor.open('snapshot-editing.txt')
    await context.Editor.setCursor(3001, 1)
    // Warm up annotation processing and collection before measured iterations.
    await edit(context)
  } catch (error) {
    await teardown(context)
    throw error
  }
}

const edit = async (context: TestContext): Promise<void> => {
  const { Editor } = context
  await Editor.focus()
  // Content is generated per iteration. The harness holds no old document
  // contents, and undo strings are distinct from the StringText objects probed.
  const marker = `snapshot${++iteration}complete`
  let before = await Snapshots.observed(context)
  await Editor.typeCharacters(marker)
  await Editor.shouldContainText(marker)
  await Snapshots.waitForConsumption(context, before + 1)
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  before = await Snapshots.observed(context)
  await Editor.press(`${modifier}+z`)
  await Snapshots.waitForConsumption(context, before + 1)
  before = await Snapshots.observed(context)
  await Editor.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y')
  await Editor.shouldContainText(marker)
  await Snapshots.waitForConsumption(context, before + 1)
  await Snapshots.assertCollected(context)
}

export const run = async (context: TestContext): Promise<void> => {
  try {
    await edit(context)
  } catch (error) {
    await teardown(context)
    throw error
  }
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    await Snapshots.restore(context)
  } finally {
    try {
      const open = await context.Workbench.evaluate({
        expression: '!!document.querySelector(\'.tab[data-resource-name="snapshot-editing.txt"]\')',
      })
      if (open) await context.QuickPick.executeCommand('View: Revert and Close Editor')
    } finally {
      try {
        await context.Editor.closeAll()
      } finally {
        await context.Workspace.remove('snapshot-editing.txt')
        await context.Workspace.remove('.vscode/settings.json')
      }
    }
  }
}
