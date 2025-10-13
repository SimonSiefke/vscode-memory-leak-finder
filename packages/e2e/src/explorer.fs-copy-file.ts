import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file-to-copy.txt',
      content: 'original content to be copied',
    },
    {
      name: 'source-folder/original-file.txt',
      content: 'file in source folder',
    },
    {
      name: 'source-folder/nested-file.js',
      content: 'console.log("hello world");',
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
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}

export const run = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  // Copy a file from root to a folder via file system operation
  await Workspace.add({
    name: 'destination-folder/copied-file.txt',
    content: 'original content to be copied',
  })

  // Verify original file still exists and copy appears in destination
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('copied-file.txt')

  // Copy a file from one folder to another via file system operation
  await Workspace.add({
    name: 'destination-folder/source-file.txt',
    content: 'file copied from source folder',
  })

  // Verify file was copied to destination
  await Explorer.refresh()
  await Explorer.shouldHaveItem('source-file.txt')

  // Copy with different name
  await Workspace.add({
    name: 'another-folder/renamed-copy.txt',
    content: 'original content to be copied',
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
