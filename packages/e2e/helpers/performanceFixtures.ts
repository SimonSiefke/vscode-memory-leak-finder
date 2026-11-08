import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { TestContext } from '../types.ts'

export const smallText = 'large needle\nsmall deterministic file\n'
export const files = [
  { name: 'small.txt', content: smallText },
  { name: 'large.txt', content: Array.from({ length: 20000 }, (_, i) => `line ${i} large needle ${'x'.repeat(60)}\n`).join('') },
  { name: 'before.txt', content: 'large needle\nunchanged\nbefore\n' },
  { name: 'after.txt', content: 'large needle\nunchanged\nafter\n' },
  ...Array.from({ length: 20 }, (_, i) => ({ name: `folder/item-${i}.txt`, content: `fixture ${i} large needle\n` })),
]

// Startup fixtures must exist before launch and before clearing filesystem caches.
export const prepareFixture = async (workspace: string): Promise<void> => {
  for (const file of files) {
    const path = join(workspace, file.name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, file.content)
  }
}

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  const workspace = Workspace.getWorkspacePath()
  const entries = await readdir(workspace, { recursive: true, withFileTypes: true }).catch(() => [])
  const existing = entries.filter((entry) => entry.isFile())
  const matches =
    existing.length === files.length &&
    (
      await Promise.all(
        files.map(async (file) => {
          return (await readFile(join(workspace, file.name), 'utf8').catch(() => undefined)) === file.content
        }),
      )
    ).every(Boolean)
  // The benchmark prepares these exact files before launch. Avoid deleting and
  // recreating them while the file index is starting; normal E2E runs still reset
  // an unrelated or modified workspace through the standard Workspace API.
  if (!matches) await Workspace.setFiles(files)
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const visibleEditorText = async ({ Editor }: TestContext, text: string): Promise<void> => {
  await Editor.shouldContainText(text)
}

export const terminalReady = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.waitForShellPrompt()
}
