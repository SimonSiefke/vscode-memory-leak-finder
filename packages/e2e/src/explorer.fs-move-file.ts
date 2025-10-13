import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file-to-move.txt',
      content: 'content to be moved',
    },
    {
      name: 'source-folder/file-in-source.txt',
      content: 'file in source folder',
    },
    {
      name: 'source-folder/nested-file.txt',
      content: 'nested file content',
    },
    {
      name: 'destination-folder/placeholder.txt',
      content: 'placeholder',
    },
    {
      name: 'another-folder/placeholder.txt',
      content: 'placeholder',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-move.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}

export const run = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  // Move a file from root to a folder via file system operation
  await Workspace.remove('file-to-move.txt')
  await Workspace.add({
    name: 'destination-folder/file-to-move.txt',
    content: 'content to be moved',
  })
  
  // Verify file is no longer in root and appears in destination folder
  await Explorer.not.toHaveItem('file-to-move.txt')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('file-to-move.txt')
  
  // Move a file from one folder to another via file system operation
  await Workspace.remove('source-folder/file-in-source.txt')
  await Workspace.add({
    name: 'destination-folder/file-in-source.txt',
    content: 'file in source folder',
  })
  
  // Verify file moved from source to destination
  await Explorer.expand('source-folder')
  await Explorer.not.toHaveItem('file-in-source.txt')
  await Explorer.shouldHaveItem('nested-file.txt') // Other file should remain
  
  await Explorer.collapse('source-folder')
  await Explorer.expand('destination-folder')
  // Add a small delay to ensure the file is visible after expansion
  await new Promise(resolve => setTimeout(resolve, 100))
  await Explorer.shouldHaveItem('file-in-source.txt')
  
  // Move entire folder to another location via file system operation
  await Workspace.remove('source-folder/nested-file.txt')
  await Workspace.add({
    name: 'another-folder/renamed-source-folder/nested-file.txt',
    content: 'nested file content',
  })
  
  // Verify folder structure change
  await Explorer.collapse('source-folder')
  await Explorer.not.toHaveItem('source-folder')
  
  await Explorer.expand('another-folder')
  await Explorer.shouldHaveItem('renamed-source-folder')
  
  // Verify nested file is still accessible in new location
  await Explorer.expand('renamed-source-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
  
  // Move file back to root from nested location
  await Workspace.remove('another-folder/renamed-source-folder/nested-file.txt')
  await Workspace.add({
    name: 'nested-file.txt',
    content: 'nested file content',
  })
  
  // Verify file is back in root
  await Explorer.collapse('renamed-source-folder')
  await Explorer.collapse('another-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
  
  // Clean up: Restore original state to make test idempotent
  await Workspace.remove('destination-folder/file-to-move.txt')
  await Workspace.add({
    name: 'file-to-move.txt',
    content: 'content to be moved',
  })
  
  await Workspace.remove('destination-folder/file-in-source.txt')
  await Workspace.add({
    name: 'source-folder/file-in-source.txt',
    content: 'file in source folder',
  })
  
  await Workspace.remove('nested-file.txt')
  await Workspace.add({
    name: 'source-folder/nested-file.txt',
    content: 'nested file content',
  })
  
  // Verify original state is restored
  await Explorer.shouldHaveItem('file-to-move.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}
