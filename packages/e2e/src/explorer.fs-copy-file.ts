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
    name: 'destination-folder/original-file.txt',
    content: 'file in source folder',
  })
  
  // Verify file was copied to destination (original should still be in source)
  await Explorer.expand('source-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  
  await Explorer.collapse('source-folder')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  
  // Copy entire folder recursively via file system operation
  await Workspace.add({
    name: 'another-folder/copied-source-folder/original-file.txt',
    content: 'file in source folder',
  })
  await Workspace.add({
    name: 'another-folder/copied-source-folder/nested-file.js',
    content: 'console.log("hello world");',
  })
  
  // Verify the entire folder structure was copied
  await Explorer.expand('another-folder')
  await Explorer.shouldHaveItem('copied-source-folder')
  
  await Explorer.expand('copied-source-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('nested-file.js')
  
  // Copy with different name
  await Workspace.add({
    name: 'another-folder/renamed-copy.txt',
    content: 'original content to be copied',
  })
  
  // Verify the renamed copy exists
  await Explorer.collapse('copied-source-folder')
  await Explorer.shouldHaveItem('renamed-copy.txt')
  
  // Copy multiple files at once
  await Workspace.add({
    name: 'destination-folder/nested-file.js',
    content: 'console.log("hello world");',
  })
  
  // Verify all files were copied
  await Explorer.collapse('another-folder')
  await Explorer.expand('destination-folder')
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('nested-file.js')
  
  // Clean up: Remove all copied files to make test idempotent
  await Workspace.remove('destination-folder/copied-file.txt')
  await Workspace.remove('destination-folder/original-file.txt')
  await Workspace.remove('destination-folder/nested-file.js')
  await Workspace.remove('another-folder/copied-source-folder/original-file.txt')
  await Workspace.remove('another-folder/copied-source-folder/nested-file.js')
  await Workspace.remove('another-folder/copied-source-folder/')
  await Workspace.remove('another-folder/renamed-copy.txt')
  
  // Verify cleanup - only original files should remain
  await Explorer.collapse('destination-folder')
  await Explorer.collapse('another-folder')
  await Explorer.shouldHaveItem('file-to-copy.txt')
  await Explorer.shouldHaveItem('source-folder')
  await Explorer.shouldHaveItem('destination-folder')
  await Explorer.shouldHaveItem('another-folder')
}
