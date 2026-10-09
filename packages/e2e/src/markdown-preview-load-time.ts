import type { TestContext } from '../types.ts'

const singleIframe = process.env.VSCODE_MEMORY_LEAK_FINDER_MARKDOWN_SINGLE_IFRAME === '1'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# Markdown preview benchmark

This document exercises **formatted text**, [heading links](#details), and \`inline code\`.

## Details

| Loader | Iframes |
| --- | ---: |
| Legacy | 2 |
| Direct | 1 |

\`\`\`ts
const loader = 'markdown-preview'
\`\`\`
`,
      name: 'markdown-preview-benchmark.md',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('markdown-preview-benchmark.md')
}

export const run = async ({ Editor, MarkdownPreview, QuickPick, WellKnownCommands }: TestContext): Promise<void> => {
  await Editor.open('markdown-preview-benchmark.md')
  await QuickPick.showCommands()
  await QuickPick.type(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const selectedAt = await QuickPick.select(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  await MarkdownPreview.shouldBeVisible({ useSingleIframe: singleIframe })
  const durationMs = performance.timeOrigin + performance.now() - selectedAt
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error(`Invalid Markdown preview load time: ${durationMs}`)
  }
  console.log(`MARKDOWN_PREVIEW_LOAD_TIME_MS=${durationMs}`)
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
