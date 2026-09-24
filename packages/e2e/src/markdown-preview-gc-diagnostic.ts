import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `# First Document`,
      name: 'first.md',
    },
    {
      content: `# Second Document`,
      name: 'second.md',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('first.md')
  await Explorer.shouldHaveItem('second.md')
}

export const run = async ({ Editor, MarkdownPreview }: TestContext): Promise<void> => {
  await Editor.open('first.md')
  await Editor.splitDown()
  await Editor.focusTopEditorGroup()
  const subFrame1 = await MarkdownPreview.show()
  await MarkdownPreview.shouldHaveHeading(subFrame1, 'first-document')

  await Editor.focusBottomEditorGroup()
  await Editor.open('second.md')
  const subFrame2 = await MarkdownPreview.show()
  await MarkdownPreview.shouldHaveHeading(subFrame2, 'second-document')

  // Diagnostic only: inspect the preview renderer while its frames are still alive.
  for (const [index, frame] of [subFrame1, subFrame2].entries()) {
    const before = await frame.sessionRpc.invoke('Runtime.getHeapUsage', {})
    const domBefore = await frame.sessionRpc.invoke('Memory.getDOMCounters', {})
    if (process.env.MARKDOWN_PREVIEW_FORCE_GC === '1') {
      await frame.sessionRpc.invoke('HeapProfiler.collectGarbage', {})
    }
    const after = await frame.sessionRpc.invoke('Runtime.getHeapUsage', {})
    const domAfter = await frame.sessionRpc.invoke('Memory.getDOMCounters', {})
    console.log('MARKDOWN_PREVIEW_HEAP', JSON.stringify({ index, before, after, domBefore, domAfter }))
  }
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
