import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'existing-file.txt',
      content: 'test content',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('existing-file.txt')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Create a new folder via terminal (file system operation)
  await Terminal.execute('mkdir new-folder')
  
  // Verify the folder appears in the explorer UI
  await Explorer.shouldHaveItem('new-folder')
  
  // Create a file inside the new folder via terminal
  await Terminal.execute('echo "nested content" > new-folder/nested-file.txt')
  
  // Expand the folder and verify the file appears
  await Explorer.expand('new-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
  
  // Create another nested folder via terminal
  await Terminal.execute('mkdir new-folder/sub-folder')
  await Terminal.execute('echo "deep content" > new-folder/sub-folder/deep-file.txt')
  
  // Verify the nested structure appears in explorer
  await Explorer.expand('sub-folder')
  await Explorer.shouldHaveItem('deep-file.txt')
}
