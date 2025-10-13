import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'existing-file.txt',
      content: 'test content',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('existing-file.txt')
}

export const run = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  // Create a new folder via file system operation
  await Workspace.add({
    name: 'new-folder/',
    content: '',
  })
  
  // Verify the folder appears in the explorer UI
  await Explorer.shouldHaveItem('new-folder')
  
  // Create a file inside the new folder via file system operation
  await Workspace.add({
    name: 'new-folder/nested-file.txt',
    content: 'nested content',
  })
  
  // Expand the folder and verify the file appears
  await Explorer.expand('new-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
  
  // Create another nested folder via file system operation
  await Workspace.add({
    name: 'new-folder/sub-folder/',
    content: '',
  })
  await Workspace.add({
    name: 'new-folder/sub-folder/deep-file.txt',
    content: 'deep content',
  })
  
  // Verify the nested structure appears in explorer
  await Explorer.expand('sub-folder')
  await Explorer.shouldHaveItem('deep-file.txt')
}
