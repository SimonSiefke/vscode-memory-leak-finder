import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: 'Reply with exactly the word ready.',
    model: 'GPT-4.1',
    verify: true,
  })
  await ChatEditor.scrollToTop()
  await ChatEditor.scrollToBottom()
  await ChatEditor.setMode('Edit')
  await ChatEditor.setMode('Ask')
  // @ts-ignore
  await ChatEditor.addAllProblemsAsContext()
  await ChatEditor.clearContext('All Problems')
  // @ts-ignore
  await ChatEditor.moveToSideBar()
  // @ts-ignore
  await ChatEditor.moveToEditor()
  await ChatEditor.clearAll()
  await ChatEditor.sendMessage({
    message: 'Reply with exactly the word done.',
    model: 'GPT-4.1',
    verify: true,
  })
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
