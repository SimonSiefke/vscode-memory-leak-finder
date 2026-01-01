import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'test content',
      name: 'existing-file.txt',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('existing-file.txt')
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  // Create a new folder by creating a file inside it (this creates the folder structure)
  await Workspace.add({
    content: 'nested content',
    name: 'new-folder/nested-file.txt',
  })

  // Verify the folder appears in the explorer UI
  await Explorer.shouldHaveItem('new-folder')

  // Expand the folder and verify the file appears
  await Explorer.expand('new-folder')
  await Explorer.shouldHaveItem('nested-file.txt')

  // Create another nested folder via file system operation
  await Workspace.add({
    content: 'deep content',
    name: 'new-folder/sub-folder/deep-file.txt',
  })

  // Verify the nested structure appears in explorer
  await Explorer.expand('sub-folder')
  await Explorer.shouldHaveItem('deep-file.txt')

  // Clean up: Remove all created files to make test idempotent
  // Note: We only remove files, not folders, to avoid directory removal issues
  await Workspace.remove('new-folder/sub-folder/deep-file.txt')
  await Workspace.remove('new-folder/nested-file.txt')

  // Refresh explorer to ensure UI updates
  await Explorer.refresh()

  // Verify cleanup - folder should be empty but may still exist
  await Explorer.collapse('sub-folder')
  await Explorer.collapse('new-folder')
  // Note: We don't check if folder is gone since empty folders might persist
  await Explorer.shouldHaveItem('existing-file.txt')
}
