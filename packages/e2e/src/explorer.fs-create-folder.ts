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
  // Create a new folder by creating a file inside it (this creates the folder structure)
  await Workspace.add({
    name: 'new-folder/nested-file.txt',
    content: 'nested content',
  })
  
  // Verify the folder appears in the explorer UI
  await Explorer.shouldHaveItem('new-folder')
  
  // Expand the folder and verify the file appears
  await Explorer.expand('new-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
  
  // Create another nested folder via file system operation
  await Workspace.add({
    name: 'new-folder/sub-folder/deep-file.txt',
    content: 'deep content',
  })
  
  // Verify the nested structure appears in explorer
  await Explorer.expand('sub-folder')
  await Explorer.shouldHaveItem('deep-file.txt')
  
  // Clean up: Remove all created files and folders to make test idempotent
  await Workspace.remove('new-folder/sub-folder/deep-file.txt')
  await Workspace.remove('new-folder/nested-file.txt')
  await Workspace.remove('new-folder/')
  
  // Refresh explorer to ensure UI updates
  await Explorer.refresh()
  
  // Verify cleanup - only original file should remain
  await Explorer.collapse('sub-folder')
  await Explorer.collapse('new-folder')
  await Explorer.not.toHaveItem('new-folder')
  await Explorer.shouldHaveItem('existing-file.txt')
}
