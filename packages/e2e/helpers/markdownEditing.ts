import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { TestContext } from '../types.ts'

const exec = promisify(execFile)
const fileName = 'editing.md'
const committedText =
  Array.from({ length: 1500 }, (_, index) => {
    if (index % 50 === 0) return `## Section ${index / 50 + 1}`
    return `Line ${String(index + 1).padStart(4, '0')}: A Markdown paragraph with **emphasis** and prose.`
  }).join('\n') + '\n'
const baselineText = committedText.replace('## Section 1\n', '## Section 1 (working copy)\n')
export const typedText = 'jkl '.repeat(16) + 'typingcheckend'

interface Options {
  readonly tracked: boolean
  readonly gitEnabled: boolean
}

const git = async ({ Workspace }: TestContext, args: string[]): Promise<string> => {
  const result = await exec('git', args, { cwd: Workspace.getWorkspacePath(), timeout: 10000 })
  return result.stdout
}

export const setup = async (context: TestContext, { tracked, gitEnabled }: Options): Promise<void> => {
  const { Editor, Git, QuickPick, SideBar, SourceControl, Workspace } = context
  await Editor.closeAll()
  await Workspace.setFiles([
    { name: '.gitignore', content: '.vscode/\n' },
    {
      name: '.vscode/settings.json',
      content: JSON.stringify({
        'git.enabled': gitEnabled,
        'git.openRepositoryInParentFolders': 'never',
        'files.autoSave': 'off',
        'files.eol': '\n',
        'editor.quickSuggestions': false,
        'editor.suggestOnTriggerCharacters': false,
        'editor.wordBasedSuggestions': 'off',
        'editor.inlineSuggest.enabled': false,
        'editor.formatOnType': false,
        'editor.wordWrap': 'off',
      }),
    },
  ])
  await Workspace.initializeGitRepository()
  await git(context, ['add', '--', '.gitignore'])
  await git(context, ['commit', '-m', 'test: initialize Markdown editing fixture'])
  await Workspace.add({ name: fileName, content: committedText })
  if (tracked) {
    await git(context, ['add', '--', fileName])
    await git(context, ['commit', '-m', 'test: track Markdown editing fixture'])
  }
  await Workspace.writeFile(fileName, baselineText)
  assert.equal(await git(context, ['status', '--porcelain', '--', fileName]), tracked ? ` M ${fileName}\n` : `?? ${fileName}\n`)
  if (gitEnabled) {
    // A previous scenario may have disabled Git or explicitly closed this path.
    await QuickPick.waitForCommand('Git: Open Repository')
    await Git.openRepository('.')
  }
  // Confirm the Git-enabled case actually has a repository in the workbench.
  await SourceControl.show()
  await SourceControl.shouldHaveRepositoryCount(gitEnabled ? 1 : 0)
  if (gitEnabled) {
    // Opening the repository returns before Git updates its command contexts.
    await QuickPick.waitForCommand('Git: Refresh')
    await QuickPick.executeCommand('Git: Refresh')
    await SourceControl.shouldHaveUnstagedFile(fileName)
  }
  await SideBar.hide()
  await Editor.open(fileName)
  await Editor.setCursor(1501, 1)
}

export const isDirty = async (Workbench: TestContext['Workbench']): Promise<boolean> => {
  const result = await Workbench.evaluate({
    expression: `(() => {
        const tab = document.querySelector('.tab[data-resource-name="${fileName}"]');
        if (!tab) throw new Error('Markdown editor tab is missing');
        return tab.classList.contains('dirty');
      })()`,
  })
  assert.equal(typeof result, 'boolean')
  return result as boolean
}

export const shouldBeClean = async (Workbench: TestContext['Workbench']): Promise<void> => {
  const deadline = Date.now() + 3000
  while (await isDirty(Workbench)) {
    assert.ok(Date.now() < deadline, 'Markdown save did not finish')
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

export const run = async ({ Editor, Workbench, Workspace }: TestContext): Promise<void> => {
  // Native key events exercise the typing path rather than replacing the model.
  // Keep this editor open across iterations, as in a sustained editing session.
  await Editor.focus()
  await Editor.typeCharacters(typedText)
  await Editor.shouldContainText('typingcheckend')
  assert.equal(await isDirty(Workbench), true, 'Typing must make the document dirty')
  // Undo grouping can vary between iterations. Wait for the saved version,
  // without opening the command palette between individual undo operations.
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  for (let index = 0; index < typedText.length && (await isDirty(Workbench)); index++) {
    await Editor.press(`${modifier}+z`)
  }
  assert.equal(await isDirty(Workbench), false, 'Undo must restore the saved document')
  // Use the command for platform-independent saving. A tab can stop showing its
  // dirty indicator while a save is still running, so also await persistence.
  await Editor.save({ viaKeyBoard: false })
  await shouldHaveSavedText(Workspace, baselineText)
}

export const shouldHaveSavedText = async (Workspace: TestContext['Workspace'], expected: string): Promise<void> => {
  let actual = ''
  const deadline = Date.now() + 3000
  do {
    actual = await readFile(join(Workspace.getWorkspacePath(), fileName), 'utf8')
    if (actual === expected) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  } while (Date.now() < deadline)
  // Keep failure output bounded instead of dumping the entire document.
  assert.fail(`Saved Markdown differs: expected ${expected.length} characters, got ${actual.length}`)
}

export const teardown = async ({ Editor, Git, QuickPick, SourceControl, Workspace }: TestContext): Promise<void> => {
  try {
    await QuickPick.executeCommand('View: Revert and Close Editor')
  } finally {
    await Editor.closeAll()
    // Restore Git while this is still a valid repository, so reactivation cannot
    // discover the harness's parent repository. Close its model before deletion.
    await Workspace.remove('.vscode/settings.json')
    await QuickPick.waitForCommand('Git: Open Repository')
    await Git.openRepository('.')
    await SourceControl.shouldHaveRepositoryCount(1)
    await Git.closeRepository()
    await SourceControl.shouldHaveRepositoryCount(0)
    await Workspace.remove('.git')
  }
}
