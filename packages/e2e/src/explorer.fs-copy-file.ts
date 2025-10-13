import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
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
      name: 'destination-folder/',
      content: '',
    },
    {
      name: 'another-folder/',
      content: '',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Copy a file from root to a folder via terminal
  await Terminal.execute('cp file-to-copy.txt destination-folder/copied-file.txt')
  
  // Verify original file still exists and copy appears in destination
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('copied-file.txt')
  
  // Copy a file from one folder to another via terminal
  await Terminal.execute('cp source-folder/original-file.txt destination-folder/')
  
  // Verify file was copied to destination (original should still be in source)
  await Explorer.expand('source-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  
  await Explorer.collapse('source-folder')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  
  // Copy entire folder recursively via terminal
  await Terminal.execute('cp -r source-folder another-folder/copied-source-folder')
  
  // Verify the entire folder structure was copied
  await Explorer.expand('another-folder')
  await Explorer.shouldHaveItem('copied-source-folder')
  
  await Explorer.expand('copied-source-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('nested-file.js')
  
  // Copy with different name
  await Terminal.execute('cp file-to-copy.txt another-folder/renamed-copy.txt')
  
  // Verify the renamed copy exists
  await Explorer.collapse('copied-source-folder')
  await Explorer.shouldHaveItem('renamed-copy.txt')
  
  // Copy multiple files at once
  await Terminal.execute('cp source-folder/*.txt destination-folder/')
  
  // Verify all txt files were copied
  await Explorer.collapse('another-folder')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('nested-file.js')
}
