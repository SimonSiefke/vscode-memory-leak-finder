import type { TestContext } from '../types.ts'

const createFiles = () => {
  const files = []
  for (let i = 0; i < 10; i++) {
    files.push({
      content: `file content ${i}`,
      name: `file-${i}.txt`,
    })
  }
  return files
}

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  const files = createFiles()
  await Workspace.setFiles(files)
  await Explorer.focus()
  await Explorer.shouldHaveItem(`file-9.txt`)
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.focusNext()
  await Explorer.click()
}
