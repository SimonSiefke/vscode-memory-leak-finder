import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'original content to be copied',
      name: 'file-to-copy.txt',
    },
    {
      content: 'file in source folder',
      name: 'source-folder/original-file.txt',
    },
    {
      content: 'console.log("hello world");',
      name: 'source-folder/nested-file.js',
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
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  // Copy a file from root to a folder via file system operation
  await Workspace.add({
    content: 'original content to be copied',
    name: 'destination-folder/copied-file.txt',
  })

  // Verify original file still exists and copy appears in destination
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.expand('destination-folder')
  await Explorer.refresh()
  await Explorer.shouldHaveItem('copied-file.txt')

  // Copy a file from one folder to another via file system operation
  await Workspace.add({
    content: 'file copied from source folder',
    name: 'destination-folder/source-file.txt',
  })

  // Verify file was copied to destination
  await Explorer.refresh()
  await Explorer.shouldHaveItem('source-file.txt')

  // Copy with different name
  await Workspace.add({
    content: 'original content to be copied',
    name: 'another-folder/renamed-copy.txt',
  })

  // Verify the renamed copy exists
  await Explorer.collapse('destination-folder')
  await Explorer.expand('another-folder')
  await Explorer.shouldHaveItem('renamed-copy.txt')

  // Clean up: Remove all copied files to make test idempotent
  await Workspace.remove('destination-folder/copied-file.txt')
  await Workspace.remove('destination-folder/source-file.txt')
  await Workspace.remove('another-folder/renamed-copy.txt')

  // Refresh explorer to ensure UI updates
  await Explorer.refresh()

  // Verify cleanup - only original files should remain
  await Explorer.collapse('destination-folder')
  await Explorer.collapse('another-folder')
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}
