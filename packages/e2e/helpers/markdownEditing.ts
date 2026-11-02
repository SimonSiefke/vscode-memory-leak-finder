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
const typedText = 'jkl '.repeat(16) + 'typingcheckend'

interface Options {
  readonly tracked: boolean
  readonly gitEnabled: boolean
}

const git = async ({ Workspace }: TestContext, args: string[]): Promise<string> => {
  const result = await exec('git', args, { cwd: Workspace.getWorkspacePath(), timeout: 10000 })
  return result.stdout
}

export const setup = async (context: TestContext, { tracked, gitEnabled }: Options): Promise<void> => {
  const { Editor, SideBar, SourceControl, Workspace } = context
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
  // Confirm the Git-enabled case actually has a repository in the workbench.
  await SourceControl.show()
  await SourceControl.shouldHaveRepositoryCount(gitEnabled ? 1 : 0)
  if (gitEnabled) await SourceControl.shouldHaveUnstagedFile(fileName)
  await SideBar.hide()
  await Editor.open(fileName)
  await Editor.setCursor(1501, 1)
}

export const run = async ({ Editor, Workbench, Workspace }: TestContext): Promise<void> => {
  // Native key events exercise the typing path rather than replacing the model.
  // Keep this editor open across iterations, as in a sustained editing session.
  await Editor.typeCharacters(typedText)
  await Editor.shouldContainText('typingcheckend')
  const isDirty = () =>
    Workbench.evaluate({
      expression: `(() => {
        const tab = document.querySelector('.tab[data-resource-name="${fileName}"]');
        if (!tab) throw new Error('Markdown editor tab is missing');
        return tab.classList.contains('dirty');
      })()`,
    })
  assert.equal(await isDirty(), true, 'Typing must make the document dirty')
  // Undo grouping can vary between iterations. Wait for the saved version,
  // without opening the command palette between individual undo operations.
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'
  for (let index = 0; index < typedText.length && (await isDirty()); index++) {
    await Editor.press(`${modifier}+z`)
  }
  assert.equal(await isDirty(), false, 'Undo must restore the saved document')
  await Editor.save({ viaKeyBoard: true })
  const actual = await readFile(join(Workspace.getWorkspacePath(), fileName), 'utf8')
  // Compare a bounded summary on failure rather than dumping a large document.
  assert.ok(actual === baselineText, `Markdown changed after undo: expected ${baselineText.length} characters, got ${actual.length}`)
}

export const teardown = async ({ Editor, QuickPick, Workspace }: TestContext): Promise<void> => {
  try {
    await QuickPick.executeCommand('View: Revert and Close Editor')
  } finally {
    await Editor.closeAll()
    await Workspace.remove('.vscode/settings.json')
  }
}
