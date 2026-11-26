import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { TestContext } from '../types.ts'

export const skip = 1

const exec = promisify(execFile)
const fileName = 'conflict.txt'
const toContent = (sharedLine: string): string => `first line\nshared line: ${sharedLine}\nlast line\n`
const baseContent = toContent('base version')
const currentContent = toContent('current change')
const incomingContent = toContent('incoming change')

interface GitResult {
  readonly exitCode: number
  readonly stdout: string
}

const git = async ({ Workspace }: TestContext, args: readonly string[]): Promise<GitResult> => {
  try {
    const { stdout } = await exec('git', args, { cwd: Workspace.getWorkspacePath(), timeout: 10_000 })
    return { exitCode: 0, stdout }
  } catch (error) {
    // `git merge` reports a conflict with exit code 1, which is expected here.
    const { code, stdout } = error as { code?: unknown; stdout?: string }
    if (typeof code === 'number') {
      return { exitCode: code, stdout: stdout ?? '' }
    }
    throw error
  }
}

const gitOk = async (context: TestContext, args: readonly string[]): Promise<string> => {
  const { exitCode, stdout } = await git(context, args)
  assert.equal(exitCode, 0, `git ${args.join(' ')} failed with exit code ${exitCode}`)
  return stdout
}

const hasMergeHead = (context: TestContext): boolean => {
  return existsSync(join(context.Workspace.getWorkspacePath(), '.git', 'MERGE_HEAD'))
}

const readConflictFile = async (context: TestContext): Promise<string> => {
  return readFile(join(context.Workspace.getWorkspacePath(), fileName), 'utf8')
}

export const setup = async (context: TestContext): Promise<void> => {
  const { Editor, Git, QuickPick, SourceControl, Workspace } = context
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      content: JSON.stringify({
        'git.mergeEditor': true,
        'files.autoSave': 'off',
        'files.eol': '\n',
      }),
      name: '.vscode/settings.json',
    },
    { content: baseContent, name: fileName },
  ])
  await Git.init()
  await Git.add()
  await Git.commit('base version')
  await Git.createBranch('feature')
  await Workspace.writeFile(fileName, incomingContent)
  await Git.add()
  await Git.commit('incoming change on feature')
  await Git.checkoutBranch('main')
  await Workspace.writeFile(fileName, currentContent)
  await Git.add()
  await Git.commit('current change on main')
  assert.equal(await gitOk(context, ['status', '--porcelain']), '')
  // The repository is created after startup, so open it explicitly instead of waiting for discovery.
  await QuickPick.waitForCommand('Git: Open Repository')
  await Git.openRepository('.')
  await SourceControl.show()
  await SourceControl.shouldHaveRepositoryCount(1)
  await QuickPick.waitForCommand('Git: Refresh')
}

export const run = async (context: TestContext): Promise<void> => {
  const { Git, MergeEditor, SourceControl } = context
  const merge = await git(context, ['merge', '--no-edit', 'feature'])
  assert.equal(merge.exitCode, 1, `expected git merge to stop on a conflict but got exit code ${merge.exitCode}`)
  assert.ok(hasMergeHead(context), 'expected a merge to be in progress')
  assert.match(await gitOk(context, ['ls-files', '-u', '--', fileName]), /conflict\.txt/)
  assert.match(await readConflictFile(context), /^<<<<<<< /m)

  await SourceControl.show()
  await SourceControl.refresh()
  await MergeEditor.openFromSourceControl(fileName)
  await MergeEditor.shouldBeVisible()
  await MergeEditor.shouldHaveRemainingConflicts(1)

  await MergeEditor.acceptAllIncoming()
  await MergeEditor.shouldHaveRemainingConflicts(0)
  await MergeEditor.shouldHaveResultContaining('shared line: incoming change')

  await MergeEditor.completeMerge()
  await MergeEditor.shouldBeClosed()
  await MergeEditor.shouldHaveNoMergeChanges()

  assert.equal(await readConflictFile(context), incomingContent)
  assert.equal(await gitOk(context, ['ls-files', '-u']), '')
  await Git.shouldHaveStagedDiffContaining(fileName, '+shared line: incoming change')
  await Git.shouldNotHaveStagedDiffContaining(fileName, '<<<<<<<')
  await Git.shouldNotHaveStagedDiffContaining(fileName, '>>>>>>>')

  // Abort so every cycle starts from the same HEAD with no merge in progress.
  await gitOk(context, ['merge', '--abort'])
  assert.ok(!hasMergeHead(context), 'expected no merge to be in progress after abort')
  assert.equal(await gitOk(context, ['status', '--porcelain']), '')
  assert.equal(await readConflictFile(context), currentContent)
  await SourceControl.refresh()
  await MergeEditor.shouldHaveNoMergeChanges()
}

export const teardown = async (context: TestContext): Promise<void> => {
  const { Editor, Workspace } = context
  if (hasMergeHead(context)) {
    await git(context, ['merge', '--abort'])
  }
  await Editor.closeAll()
  await Workspace.setFiles([])
}
