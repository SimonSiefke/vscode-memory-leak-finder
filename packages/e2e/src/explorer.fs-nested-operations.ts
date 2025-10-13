import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
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
}

export const run = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  // Create complex nested structure via file system operation
  await Workspace.add({
    name: 'complex/nested/structure/deep-file.txt',
    content: 'deep content',
  })
  
  // Verify the complex structure appears in explorer
  await Explorer.shouldHaveItem('complex')
  await Explorer.expand('complex')
  await Explorer.shouldHaveItem('nested')
  
  await Explorer.expand('nested')
  await Explorer.shouldHaveItem('structure')
  
  await Explorer.expand('structure')
  await Explorer.shouldHaveItem('deep-file.txt')
  
  // Rename deeply nested folder
  await Workspace.remove('complex/nested/structure/with/many/levels/very-deep-file.txt')
  await Workspace.add({
    name: 'complex/nested/structure/with/many/renamed-levels/very-deep-file.txt',
    content: 'very deep content',
  })
  
  // Verify the rename is reflected in explorer
  await Explorer.collapse('levels')
  await Explorer.not.toHaveItem('levels')
  await Explorer.shouldHaveItem('renamed-levels')
  
  // Move entire nested branch to different location
  await Workspace.remove('complex/nested/structure/with/many/renamed-levels/very-deep-file.txt')
  await Workspace.add({
    name: 'another-branch/moved-structure/with/many/renamed-levels/very-deep-file.txt',
    content: 'very deep content',
  })
  
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
  await Workspace.add({
    name: 'temp/nested/folders/temp-file.txt',
    content: 'temp content',
  })
  
  // Verify creation
  await Explorer.shouldHaveItem('temp')
  await Explorer.expand('temp')
  await Explorer.shouldHaveItem('nested')
  await Explorer.expand('nested')
  await Explorer.shouldHaveItem('folders')
  await Explorer.expand('folders')
  await Explorer.shouldHaveItem('temp-file.txt')
  
  // Delete the entire nested structure
  await Workspace.remove('temp/nested/folders/temp-file.txt')
  await Workspace.remove('temp/nested/folders/')
  await Workspace.remove('temp/nested/')
  await Workspace.remove('temp/')
  
  // Verify deletion
  await Explorer.collapse('folders')
  await Explorer.collapse('nested')
  await Explorer.collapse('temp')
  await Explorer.not.toHaveItem('temp')
  
  // Test renaming intermediate level folder
  await Workspace.remove('level1/level2/level3/deep-file.txt')
  await Workspace.remove('level1/level2/mid-file.txt')
  await Workspace.add({
    name: 'level1/renamed-level2/level3/deep-file.txt',
    content: 'deeply nested content',
  })
  await Workspace.add({
    name: 'level1/renamed-level2/mid-file.txt',
    content: 'mid level content',
  })
  
  // Verify the rename affects the entire subtree
  await Explorer.expand('level1')
  await Explorer.not.toHaveItem('level2')
  await Explorer.shouldHaveItem('renamed-level2')
  
  await Explorer.expand('renamed-level2')
  await Explorer.shouldHaveItem('level3')
  await Explorer.shouldHaveItem('mid-file.txt')
  
  await Explorer.expand('level3')
  await Explorer.shouldHaveItem('deep-file.txt')
  
  // Clean up: Restore original state to make test idempotent
  await Workspace.remove('complex/nested/structure/with/many/renamed-levels/very-deep-file.txt')
  await Workspace.remove('complex/nested/structure/with/many/renamed-levels/')
  await Workspace.remove('complex/nested/structure/with/many/')
  await Workspace.remove('complex/nested/structure/with/')
  await Workspace.remove('complex/nested/structure/')
  await Workspace.remove('complex/nested/')
  await Workspace.remove('complex/')
  
  await Workspace.remove('another-branch/moved-structure/with/many/renamed-levels/very-deep-file.txt')
  await Workspace.remove('another-branch/moved-structure/with/many/renamed-levels/')
  await Workspace.remove('another-branch/moved-structure/with/many/')
  await Workspace.remove('another-branch/moved-structure/with/')
  await Workspace.remove('another-branch/moved-structure/')
  
  await Workspace.remove('level1/renamed-level2/level3/deep-file.txt')
  await Workspace.remove('level1/renamed-level2/mid-file.txt')
  await Workspace.add({
    name: 'level1/level2/level3/deep-file.txt',
    content: 'deeply nested content',
  })
  await Workspace.add({
    name: 'level1/level2/mid-file.txt',
    content: 'mid level content',
  })
  
  // Verify original state is restored
  await Explorer.collapse('level3')
  await Explorer.collapse('renamed-level2')
  await Explorer.collapse('level1')
  await Explorer.shouldHaveItem('level1')
  await Explorer.shouldHaveItem('another-branch')
}
