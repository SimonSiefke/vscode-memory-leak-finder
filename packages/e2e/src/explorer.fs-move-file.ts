import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
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
      name: 'destination-folder/',
      content: '',
    },
    {
      name: 'another-folder/',
      content: '',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-move.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Move a file from root to a folder via terminal
  await Terminal.execute('mv file-to-move.txt destination-folder/')
  
  // Verify file is no longer in root and appears in destination folder
  await Explorer.not.toHaveItem('file-to-move.txt')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('file-to-move.txt')
  
  // Move a file from one folder to another via terminal
  await Terminal.execute('mv source-folder/file-in-source.txt destination-folder/')
  
  // Verify file moved from source to destination
  await Explorer.expand('source-folder')
  await Explorer.not.toHaveItem('file-in-source.txt')
  await Explorer.shouldHaveItem('nested-file.txt') // Other file should remain
  
  await Explorer.collapse('source-folder')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('file-in-source.txt')
  
  // Move entire folder to another location via terminal
  await Terminal.execute('mv source-folder another-folder/renamed-source-folder')
  
  // Verify folder structure change
  await Explorer.collapse('source-folder')
  await Explorer.not.toHaveItem('source-folder')
  
  await Explorer.expand('another-folder')
  await Explorer.shouldHaveItem('renamed-source-folder')
  
  // Verify nested file is still accessible in new location
  await Explorer.expand('renamed-source-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
  
  // Move file back to root from nested location
  await Terminal.execute('mv another-folder/renamed-source-folder/nested-file.txt ./')
  
  // Verify file is back in root
  await Explorer.collapse('renamed-source-folder')
  await Explorer.collapse('another-folder')
  await Explorer.shouldHaveItem('nested-file.txt')
}
