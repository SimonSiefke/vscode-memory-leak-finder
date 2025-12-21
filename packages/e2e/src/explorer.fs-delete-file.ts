import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'content to be deleted',
      name: 'file-to-delete.txt',
    },
    {
      content: 'this should remain',
      name: 'keep-this-file.txt',
    },
    {
      content: 'nested content',
      name: 'nested-folder/file-in-folder.txt',
    },
    {
      content: 'another nested file',
      name: 'nested-folder/another-file.txt',
    },
    {
      content: 'placeholder',
      name: 'empty-folder/placeholder.txt',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('keep-this-file.txt')
  await Explorer.shouldHaveItem('nested-folder')
  await Explorer.shouldHaveItem('empty-folder')
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
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
    content: 'content to be deleted',
    name: 'file-to-delete.txt',
  })
  await Workspace.add({
    content: 'nested content',
    name: 'nested-folder/file-in-folder.txt',
  })
  await Workspace.add({
    content: 'another nested file',
    name: 'nested-folder/another-file.txt',
  })
  // Note: empty-folder will be recreated when we add the placeholder file
  await Workspace.add({
    content: 'placeholder',
    name: 'empty-folder/placeholder.txt',
  })

  // Verify original state is restored
  await Explorer.shouldHaveItem('file-to-delete.txt')
  await Explorer.shouldHaveItem('nested-folder')
  await Explorer.shouldHaveItem('empty-folder')
}
