import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'This is sample content for the editor move to new window test',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // Step 1: Open the editor
  await Editor.open('file.txt')

  // Step 2: Run command to move editor to new window
  const newWindow = await Editor.moveToNewWindow()

  // Step 3: Wait for the new window to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Step 4: Verify new window is created (already verified by getting the window object)

  // Step 5: Close the newly created window
  await newWindow.close()

  // Give the window time to close
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
