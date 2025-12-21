import type { TestContext } from '../types.ts'

export const skip = true // TODO: Fix file system synchronization issues

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'content to be moved',
      name: 'file-to-move.txt',
    },
    {
      content: 'file in source folder',
      name: 'source-folder/file-in-source.txt',
    },
    {
      content: 'nested file content',
      name: 'source-folder/nested-file.txt',
    },
    {
      content: 'placeholder',
      name: 'destination-folder/placeholder.txt',
    },
    {
      content: 'placeholder',
      name: 'another-folder/placeholder.txt',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-move.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  // Move a file from root to a folder via file system operation
  await Workspace.remove('file-to-move.txt')
  await Workspace.add({
    content: 'content to be moved',
    name: 'destination-folder/file-to-move.txt',
  })

  // Verify file is no longer in root and appears in destination folder
  await Explorer.not.toHaveItem('file-to-move.txt')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('file-to-move.txt')

  // Move a file from one folder to another via file system operation
  await Workspace.remove('source-folder/file-in-source.txt')
  await Workspace.add({
    content: 'file in source folder',
    name: 'destination-folder/file-in-source.txt',
  })

  // Verify file moved from source to destination
  await Explorer.expand('source-folder')
  await Explorer.not.toHaveItem('file-in-source.txt')
  await Explorer.shouldHaveItem('nested-file.txt') // Other file should remain

  await Explorer.collapse('source-folder')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('file-in-source.txt')

  // Move entire folder to another location via file system operation
  await Workspace.remove('source-folder/nested-file.txt')
  await Workspace.remove('source-folder')
  await Workspace.add({
    content: 'nested file content',
    name: 'another-folder/renamed-source-folder/nested-file.txt',
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
    content: 'nested file content',
    name: 'nested-file.txt',
  })

  // Verify file is back in root
  await Explorer.collapse('renamed-source-folder')
  await Explorer.collapse('another-folder')
  await Explorer.shouldHaveItem('nested-file.txt')

  // Clean up: Restore original state to make test idempotent
  await Workspace.remove('destination-folder/file-to-move.txt')
  await Workspace.add({
    content: 'content to be moved',
    name: 'file-to-move.txt',
  })

  await Workspace.remove('destination-folder/file-in-source.txt')
  await Workspace.add({
    content: 'file in source folder',
    name: 'source-folder/file-in-source.txt',
  })

  await Workspace.remove('nested-file.txt')
  await Workspace.add({
    content: 'nested file content',
    name: 'source-folder/nested-file.txt',
  })

  // Verify original state is restored
  await Explorer.shouldHaveItem('file-to-move.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}
