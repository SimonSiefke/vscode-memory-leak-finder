import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ ChatEditor, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // @ts-ignore
  await ChatEditor.addAllProblemsAsContext()
  await ChatEditor.clearContext('All Problems')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
