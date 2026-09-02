import type { TestContext } from '../types.ts'

export const skip = 1

const fileCount = 40
const largeText = `${'A'.repeat(8 * 1024)}\n`
let nextFile = 0

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles(
    Array.from({ length: fileCount }, (_, index) => ({
      content: largeText,
      name: `large-edit-buffer-${index + 1}.txt`,
    })),
  )
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  const fileName = `large-edit-buffer-${(nextFile++ % fileCount) + 1}.txt`
  try {
    await Editor.open(fileName)
    await Editor.focus()
    await Editor.replaceActiveLineAndSave({ replacement: 'x' })
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
