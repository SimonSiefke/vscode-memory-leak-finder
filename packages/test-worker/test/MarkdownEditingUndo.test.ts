/** @jest-environment jsdom */
import { afterEach, expect, test } from '@jest/globals'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const document = (globalThis as any).document
const { setup, run, typedText } = await import(new URL('../../e2e/helpers/markdownEditing.ts', import.meta.url).href)
const directories: string[] = []
const timers: ReturnType<typeof setTimeout>[] = []
afterEach(async () => {
  for (const timer of timers.splice(0)) clearTimeout(timer)
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

test.each([1, 2])('waits for rendered undo and clean state with %s undo groups', async (groups) => {
  const root = await mkdtemp(join(tmpdir(), 'markdown-undo-'))
  directories.push(root)
  document.body.innerHTML =
    '<div class="tab" data-resource-name="editing.md"></div><div class="editor-instance"><div class="view-lines"></div></div>'
  const tab = document.querySelector('.tab')!
  const lines = document.querySelector('.view-lines')!
  let baseline = ''
  let model = ''
  let undos = 0
  const putFile = async ({ name, content }: { name: string; content: string }) => {
    const path = join(root, name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, content)
  }
  const context = {
    Editor: {
      closeAllEditorGroups: async () => {},
      focus: async () => {},
      open: async () => {
        baseline = model = await readFile(join(root, 'editing.md'), 'utf8')
        lines.textContent = model
      },
      setCursor: async () => {},
      typeCharacters: async (text: string) => {
        model += text
        lines.textContent = model
        tab.classList.add('dirty')
      },
      shouldContainText: async (text: string) => {
        expect(lines.textContent).toContain(text)
      },
      press: async () => {
        undos++
        // Undo and dirty-state notifications can finish after the key event.
        // A second key before rendering finishes would undo past the save point.
        const expected = groups === 2 && undos === 1 ? baseline + typedText.slice(0, 10) : baseline
        if (undos > groups) model = baseline.slice(0, -undos)
        else model = expected
        timers.push(
          setTimeout(() => {
            lines.textContent = model
          }, 20),
        )
        timers.push(
          setTimeout(() => {
            if (model === baseline) tab.classList.remove('dirty')
          }, 60),
        )
      },
      save: async () => {
        await writeFile(join(root, 'editing.md'), model)
        tab.classList.remove('dirty')
      },
    },
    Git: { openRepository: async () => {} },
    QuickPick: { waitForCommand: async () => {}, executeCommand: async () => {} },
    SideBar: { hide: async () => {} },
    SourceControl: {
      show: async () => {},
      shouldHaveRepositoryCount: async () => {},
      shouldHaveUnstagedFile: async () => {},
    },
    Workbench: {
      evaluate: async ({ expression }: { expression: string }) => Function('document', `return (${expression})`)(document),
    },
    Workspace: {
      getWorkspacePath: () => root,
      setFiles: async (files: Array<{ name: string; content: string }>) => {
        for (const file of files) await putFile(file)
      },
      add: putFile,
      writeFile: async (name: string, content: string) => putFile({ name, content }),
      initializeGitRepository: async () => {
        for (const args of [['init'], ['config', 'user.name', 'Test User'], ['config', 'user.email', 'test@example.com']]) {
          execFileSync('git', args, { cwd: root, stdio: 'pipe' })
        }
      },
    },
  }
  await setup(context, { tracked: true, gitEnabled: true })
  await run(context)
  expect(undos).toBe(groups)
  expect(tab.classList.contains('dirty')).toBe(false)
  expect(await readFile(join(root, 'editing.md'), 'utf8')).toBe(baseline)
})
