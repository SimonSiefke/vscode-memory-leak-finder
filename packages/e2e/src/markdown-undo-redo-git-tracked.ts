import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as MarkdownEditing from '../helpers/markdownEditing.ts'
import * as MarkdownTyping from '../helpers/markdownTyping.ts'
import type { TestContext } from '../types.ts'

let expectedText = ''

export const setup = async (context: TestContext): Promise<void> => {
  await MarkdownTyping.setup(context, { tracked: true, gitEnabled: true })
  await MarkdownTyping.run(context)
  expectedText = await readFile(join(context.Workspace.getWorkspacePath(), 'editing.md'), 'utf8')
}

export const run = async ({ Editor, Workbench, Workspace }: TestContext): Promise<void> => {
  await Editor.focus()
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  await Editor.press(`${modifier}+z`)
  assert.equal(await MarkdownEditing.isDirty(Workbench), true, 'Undo must change the saved document')
  await Editor.save({ viaKeyBoard: false })
  await MarkdownEditing.shouldBeClean(Workbench)
  // Grouping depends on native typing. Every group in this fixture is a suffix
  // of the one insertion made in setup, so avoid assuming a fixed group size.
  let undone = expectedText
  const deadline = Date.now() + 3000
  do {
    undone = await readFile(join(Workspace.getWorkspacePath(), 'editing.md'), 'utf8')
    if (undone !== expectedText) break
    await new Promise((resolve) => setTimeout(resolve, 20))
  } while (Date.now() < deadline)
  assert.ok(
    undone.length < expectedText.length && undone.length >= expectedText.length - MarkdownEditing.typedText.length,
    `Undo must shorten the saved document by 1-${MarkdownEditing.typedText.length} characters: before ${expectedText.length}, after ${undone.length}`,
  )
  assert.ok(expectedText.startsWith(undone), 'Undo must remove a suffix of the inserted text')
  await Editor.press(process.platform === 'darwin' ? 'Meta+Shift+z' : 'Control+y')
  await Editor.save({ viaKeyBoard: false })
  await MarkdownEditing.shouldBeClean(Workbench)
  await MarkdownEditing.shouldHaveSavedText(Workspace, expectedText)
}

export const teardown = MarkdownEditing.teardown
