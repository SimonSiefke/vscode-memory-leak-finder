import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'original-file.txt',
      content: 'original file content',
    },
    {
      name: 'target-folder/original-folder-file.txt',
      content: 'file in target folder',
    },
    {
      name: 'target-folder/nested/deep-file.txt',
      content: 'deep file content',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('original-file.txt')
  await Explorer.shouldHaveItem('target-folder')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Create symbolic link to a file via terminal
  await Terminal.execute('ln -s original-file.txt symlink-to-file')
  
  // Verify the symbolic link appears in explorer
  await Explorer.shouldHaveItem('symlink-to-file')
  
  // Create symbolic link to a folder via terminal
  await Terminal.execute('ln -s target-folder symlink-to-folder')
  
  // Verify the symbolic link to folder appears
  await Explorer.shouldHaveItem('symlink-to-folder')
  
  // Expand the symbolic link to folder and verify contents
  await Explorer.expand('symlink-to-folder')
  await Explorer.shouldHaveItem('original-folder-file.txt')
  await Explorer.shouldHaveItem('nested')
  
  // Expand nested folder through symlink
  await Explorer.expand('nested')
  await Explorer.shouldHaveItem('deep-file.txt')
  
  // Create symbolic link with different name
  await Terminal.execute('ln -s original-file.txt renamed-symlink.txt')
  
  // Verify the renamed symlink appears
  await Explorer.shouldHaveItem('renamed-symlink.txt')
  
  // Create symbolic link to a file in a subfolder
  await Terminal.execute('ln -s target-folder/original-folder-file.txt symlink-to-nested-file')
  
  // Verify the symlink to nested file appears
  await Explorer.shouldHaveItem('symlink-to-nested-file')
  
  // Test renaming a symbolic link
  await Terminal.execute('mv symlink-to-file renamed-symlink-to-file')
  
  // Verify the symlink rename
  await Explorer.not.toHaveItem('symlink-to-file')
  await Explorer.shouldHaveItem('renamed-symlink-to-file')
  
  // Test deleting a symbolic link (should not affect original)
  await Terminal.execute('rm symlink-to-nested-file')
  
  // Verify symlink is gone but original file remains
  await Explorer.not.toHaveItem('symlink-to-nested-file')
  await Explorer.expand('target-folder')
  await Explorer.shouldHaveItem('original-folder-file.txt')
  
  // Test creating symlink to non-existent file (broken symlink)
  await Terminal.execute('ln -s non-existent-file.txt broken-symlink')
  
  // Verify broken symlink appears (behavior may vary by OS)
  await Explorer.shouldHaveItem('broken-symlink')
  
  // Test creating relative symlink
  await Terminal.execute('ln -s ../original-file.txt target-folder/relative-symlink')
  
  // Verify relative symlink appears in target folder
  await Explorer.expand('target-folder')
  await Explorer.shouldHaveItem('relative-symlink')
  
  // Test symlink to symlink (chain)
  await Terminal.execute('ln -s symlink-to-folder chained-symlink')
  
  // Verify chained symlink works
  await Explorer.collapse('target-folder')
  await Explorer.shouldHaveItem('chained-symlink')
  await Explorer.expand('chained-symlink')
  await Explorer.shouldHaveItem('original-folder-file.txt')
}
