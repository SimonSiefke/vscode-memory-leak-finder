import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'original content',
      name: 'original-file.txt',
    },
    {
      content: 'nested content',
      name: 'folder/nested-file.txt',
    },
    {
      content: 'console.log("hello");',
      name: 'another-file.js',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('folder')
  await Explorer.shouldHaveItem('another-file.js')
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  // Rename a file via file system operation
  await Workspace.remove('original-file.txt')
  await Workspace.add({
    content: 'original content',
    name: 'renamed-file.txt',
  })

  // Verify the old name is gone and new name appears in explorer
  await Explorer.not.toHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('renamed-file.txt')

  // Rename a file in a subfolder via file system operation
  await Workspace.remove('folder/nested-file.txt')
  await Workspace.add({
    content: 'nested content',
    name: 'folder/renamed-nested-file.txt',
  })

  // Expand folder and verify the rename
  await Explorer.expand('folder')
  await Explorer.not.toHaveItem('nested-file.txt')
  await Explorer.shouldHaveItem('renamed-nested-file.txt')

  // Rename with different extension
  await Workspace.remove('another-file.js')
  await Workspace.add({
    content: 'console.log("hello");',
    name: 'another-file.ts',
  })

  // Verify the extension change is reflected
  await Explorer.not.toHaveItem('another-file.js')
  await Explorer.shouldHaveItem('another-file.ts')

  // Rename folder itself by recreating the structure
  await Workspace.remove('folder/renamed-nested-file.txt')
  await Workspace.add({
    content: 'nested content',
    name: 'renamed-folder/renamed-nested-file.txt',
  })

  // Collapse and verify folder rename
  await Explorer.collapse('folder')
  // Note: We don't check if old folder is gone since it might persist
  await Explorer.shouldHaveItem('renamed-folder')

  // Expand renamed folder and verify nested file is still there
  await Explorer.expand('renamed-folder')
  await Explorer.shouldHaveItem('renamed-nested-file.txt')

  // Clean up: Restore original state to make test idempotent
  await Workspace.remove('renamed-folder/renamed-nested-file.txt')
  await Workspace.add({
    content: 'nested content',
    name: 'folder/nested-file.txt',
  })

  await Workspace.remove('renamed-file.txt')
  await Workspace.add({
    content: 'original content',
    name: 'original-file.txt',
  })

  await Workspace.remove('another-file.ts')
  await Workspace.add({
    content: 'console.log("hello");',
    name: 'another-file.js',
  })

  // Refresh explorer to ensure UI updates
  await Explorer.refresh()

  // Verify original state is restored
  await Explorer.collapse('renamed-folder')
  // Note: We don't check if renamed-folder is gone since empty folders might persist
  await Explorer.shouldHaveItem('folder')
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('another-file.js')
}
