import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'original-file.txt',
      content: 'original content',
    },
    {
      name: 'folder/nested-file.txt',
      content: 'nested content',
    },
    {
      name: 'another-file.js',
      content: 'console.log("hello");',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('folder')
  await Explorer.shouldHaveItem('another-file.js')
}

export const run = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  // Rename a file via file system operation
  await Workspace.remove('original-file.txt')
  await Workspace.add({
    name: 'renamed-file.txt',
    content: 'original content',
  })
  
  // Verify the old name is gone and new name appears in explorer
  await Explorer.not.toHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('renamed-file.txt')
  
  // Rename a file in a subfolder via file system operation
  await Workspace.remove('folder/nested-file.txt')
  await Workspace.add({
    name: 'folder/renamed-nested-file.txt',
    content: 'nested content',
  })
  
  // Expand folder and verify the rename
  await Explorer.expand('folder')
  await Explorer.not.toHaveItem('nested-file.txt')
  await Explorer.shouldHaveItem('renamed-nested-file.txt')
  
  // Rename with different extension
  await Workspace.remove('another-file.js')
  await Workspace.add({
    name: 'another-file.ts',
    content: 'console.log("hello");',
  })
  
  // Verify the extension change is reflected
  await Explorer.not.toHaveItem('another-file.js')
  await Explorer.shouldHaveItem('another-file.ts')
  
  // Rename folder itself by recreating the structure
  await Workspace.remove('folder/renamed-nested-file.txt')
  await Workspace.add({
    name: 'renamed-folder/renamed-nested-file.txt',
    content: 'nested content',
  })
  
  // Collapse and verify folder rename
  await Explorer.collapse('folder')
  await Explorer.not.toHaveItem('folder')
  await Explorer.shouldHaveItem('renamed-folder')
  
  // Expand renamed folder and verify nested file is still there
  await Explorer.expand('renamed-folder')
  await Explorer.shouldHaveItem('renamed-nested-file.txt')
  
  // Clean up: Restore original state to make test idempotent
  await Workspace.remove('renamed-folder/renamed-nested-file.txt')
  await Workspace.add({
    name: 'folder/nested-file.txt',
    content: 'nested content',
  })
  
  await Workspace.remove('renamed-file.txt')
  await Workspace.add({
    name: 'original-file.txt',
    content: 'original content',
  })
  
  await Workspace.remove('another-file.ts')
  await Workspace.add({
    name: 'another-file.js',
    content: 'console.log("hello");',
  })
  
  // Verify original state is restored
  await Explorer.collapse('renamed-folder')
  await Explorer.not.toHaveItem('renamed-folder')
  await Explorer.shouldHaveItem('folder')
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('another-file.js')
}
