import type { TestContext } from '../types.ts'

export const skip = 1

const title = 'File System Provider Virtual Document Lifecycle'
// Keep these in sync with fixtures/sample.file-system-provider-virtual-document-lifecycle/extension.js.
const seedText = 'memfs seed'
const typedSuffix = ' typed'
const externalText = 'memfs external change'

const runFixtureCommand = async ({ Notification, QuickPick }: TestContext, command: string, expectedMessage: string): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand(`${title}: ${command}`)
    // Selecting a command does not await its extension callback; failures post an error instead.
    await Notification.shouldHaveItem(`${title}: ${expectedMessage}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const setup = async (context: TestContext): Promise<void> => {
  await runFixtureCommand(context, 'Setup', 'setup complete')
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor } = context
  // Registers the vmlf-memfs provider and opens its seeded single-line file.
  await runFixtureCommand(context, 'Open', 'open complete')
  await Editor.shouldHaveText(seedText)
  await Editor.focus()
  await Editor.goToEndOfLine()
  // Real key events insert at the caret; Editor.type replaces the edit context text from offset 0.
  await Editor.typeCharacters(typedSuffix)
  await Editor.shouldHaveText(seedText + typedSuffix)
  await Editor.save({ viaKeyBoard: true })
  await runFixtureCommand(context, 'Verify Saved', `saved bytes verified: ${new TextEncoder().encode(seedText + typedSuffix).byteLength}`)
  // The provider changes its bytes and fires onDidChangeFile; the clean editor must reload them.
  await runFixtureCommand(context, 'External Change', 'external change applied')
  await Editor.shouldHaveText(externalText)
  await Editor.close()
  // Waits for the document to close, then disposes the registration and its event emitter.
  await runFixtureCommand(context, 'Unregister', 'cycle complete')
}

export const teardown = async (context: TestContext): Promise<void> => {
  await runFixtureCommand(context, 'Cleanup', 'cleanup complete')
}
