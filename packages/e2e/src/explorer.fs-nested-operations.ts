import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'level1/level2/level3/deep-file.txt',
      content: 'deeply nested content',
    },
    {
      name: 'level1/level2/mid-file.txt',
      content: 'mid level content',
    },
    {
      name: 'level1/top-file.txt',
      content: 'top level content',
    },
    {
      name: 'another-branch/sub1/sub2/file.txt',
      content: 'another branch file',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('level1')
  await Explorer.shouldHaveItem('another-branch')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Create complex nested structure via terminal
  await Terminal.execute('mkdir -p complex/nested/structure/with/many/levels')
  await Terminal.execute('echo "very deep content" > complex/nested/structure/with/many/levels/very-deep-file.txt')
  
  // Verify the complex structure appears in explorer
  await Explorer.shouldHaveItem('complex')
  await Explorer.expand('complex')
  await Explorer.shouldHaveItem('nested')
  
  await Explorer.expand('nested')
  await Explorer.shouldHaveItem('structure')
  
  await Explorer.expand('structure')
  await Explorer.shouldHaveItem('with')
  
  await Explorer.expand('with')
  await Explorer.shouldHaveItem('many')
  
  await Explorer.expand('many')
  await Explorer.shouldHaveItem('levels')
  
  await Explorer.expand('levels')
  await Explorer.shouldHaveItem('very-deep-file.txt')
  
  // Rename deeply nested folder
  await Terminal.execute('mv complex/nested/structure/with/many/levels complex/nested/structure/with/many/renamed-levels')
  
  // Verify the rename is reflected in explorer
  await Explorer.collapse('levels')
  await Explorer.not.toHaveItem('levels')
  await Explorer.shouldHaveItem('renamed-levels')
  
  // Move entire nested branch to different location
  await Terminal.execute('mv complex/nested/structure another-branch/moved-structure')
  
  // Verify the move operation
  await Explorer.collapse('renamed-levels')
  await Explorer.collapse('many')
  await Explorer.collapse('with')
  await Explorer.collapse('structure')
  await Explorer.collapse('nested')
  await Explorer.collapse('complex')
  await Explorer.not.toHaveItem('structure')
  
  await Explorer.expand('another-branch')
  await Explorer.shouldHaveItem('moved-structure')
  
  // Create and delete nested folders in sequence
  await Terminal.execute('mkdir -p temp/nested/folders')
  await Terminal.execute('echo "temp content" > temp/nested/folders/temp-file.txt')
  
  // Verify creation
  await Explorer.shouldHaveItem('temp')
  await Explorer.expand('temp')
  await Explorer.shouldHaveItem('nested')
  await Explorer.expand('nested')
  await Explorer.shouldHaveItem('folders')
  await Explorer.expand('folders')
  await Explorer.shouldHaveItem('temp-file.txt')
  
  // Delete the entire nested structure
  await Terminal.execute('rm -rf temp')
  
  // Verify deletion
  await Explorer.collapse('folders')
  await Explorer.collapse('nested')
  await Explorer.collapse('temp')
  await Explorer.not.toHaveItem('temp')
  
  // Test renaming intermediate level folder
  await Terminal.execute('mv level1/level2 level1/renamed-level2')
  
  // Verify the rename affects the entire subtree
  await Explorer.expand('level1')
  await Explorer.not.toHaveItem('level2')
  await Explorer.shouldHaveItem('renamed-level2')
  
  await Explorer.expand('renamed-level2')
  await Explorer.shouldHaveItem('level3')
  await Explorer.shouldHaveItem('mid-file.txt')
  
  await Explorer.expand('level3')
  await Explorer.shouldHaveItem('deep-file.txt')
}
