import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file-to-delete.txt',
      content: 'content to be deleted',
    },
    {
      name: 'keep-this-file.txt',
      content: 'this should remain',
    },
    {
      name: 'nested-folder/file-in-folder.txt',
      content: 'nested content',
    },
    {
      name: 'nested-folder/another-file.txt',
      content: 'another nested file',
    },
    {
      name: 'empty-folder/placeholder.txt',
      content: 'placeholder',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('keep-this-file.txt')
  await Explorer.shouldHaveItem('nested-folder')
  await Explorer.shouldHaveItem('empty-folder')
}

export const run = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  // Delete a single file via file system operation
  await Workspace.remove('file-to-delete.txt')

  // Verify the file is removed from explorer
  await Explorer.not.toHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('keep-this-file.txt') // Other file should remain

  // Delete a file from nested folder via file system operation
  await Workspace.remove('nested-folder/file-in-folder.txt')

  // Expand folder and verify the file is gone
  await Explorer.expand('nested-folder')
  await Explorer.not.toHaveItem('file-in-folder.txt')
  await Explorer.shouldHaveItem('another-file.txt') // Other file in folder should remain

  // Delete entire folder with contents via file system operation
  await Workspace.remove('nested-folder/another-file.txt')
  await Workspace.remove('nested-folder/')

  // Verify the entire folder is removed from explorer
  await Explorer.collapse('nested-folder')
  await Explorer.not.toHaveItem('nested-folder')

  // Delete empty folder via file system operation
  await Workspace.remove('empty-folder/')

  // Verify empty folder is removed
  await Explorer.not.toHaveItem('empty-folder')

  // Verify remaining file is still there
  await Explorer.shouldHaveItem('keep-this-file.txt')

  // Clean up: Restore original state to make test idempotent
  await Workspace.add({
    name: 'file-to-delete.txt',
    content: 'content to be deleted',
  })
  await Workspace.add({
    name: 'nested-folder/file-in-folder.txt',
    content: 'nested content',
  })
  await Workspace.add({
    name: 'nested-folder/another-file.txt',
    content: 'another nested file',
  })
  // Note: empty-folder will be recreated when we add the placeholder file
  await Workspace.add({
    name: 'empty-folder/placeholder.txt',
    content: 'placeholder',
  })

  // Verify original state is restored
  await Explorer.shouldHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('nested-folder')
  await Explorer.shouldHaveItem('empty-folder')
}
