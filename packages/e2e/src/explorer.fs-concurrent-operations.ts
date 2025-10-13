import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'base-file.txt',
      content: 'base content',
    },
    {
      name: 'folder1/',
      content: '',
    },
    {
      name: 'folder2/',
      content: '',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('base-file.txt')
  await Explorer.shouldHaveItem('folder1')
  await Explorer.shouldHaveItem('folder2')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Create multiple files concurrently via terminal
  await Terminal.execute('touch file1.txt file2.txt file3.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify all files appear in explorer
  await Explorer.shouldHaveItem('file1.txt')
  await Explorer.shouldHaveItem('file2.txt')
  await Explorer.shouldHaveItem('file3.txt')
  
  // Create files in different folders concurrently
  await Terminal.execute('echo "content1" > folder1/file1.txt &')
  await Terminal.execute('echo "content2" > folder2/file2.txt &')
  await Terminal.execute('echo "content3" > folder1/file3.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify files appear in correct folders
  await Explorer.expand('folder1')
  await Explorer.shouldHaveItem('file1.txt')
  await Explorer.shouldHaveItem('file3.txt')
  
  await Explorer.collapse('folder1')
  await Explorer.expand('folder2')
  await Explorer.shouldHaveItem('file2.txt')
  
  // Test concurrent rename operations
  await Terminal.execute('mv file1.txt renamed-file1.txt &')
  await Terminal.execute('mv file2.txt renamed-file2.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify renames are reflected
  await Explorer.collapse('folder2')
  await Explorer.not.toHaveItem('file1.txt')
  await Explorer.not.toHaveItem('file2.txt')
  await Explorer.shouldHaveItem('renamed-file1.txt')
  await Explorer.shouldHaveItem('renamed-file2.txt')
  
  // Test concurrent copy operations
  await Terminal.execute('cp renamed-file1.txt folder1/copy1.txt &')
  await Terminal.execute('cp renamed-file2.txt folder2/copy2.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify copies appear in correct locations
  await Explorer.expand('folder1')
  await Explorer.shouldHaveItem('copy1.txt')
  
  await Explorer.collapse('folder1')
  await Explorer.expand('folder2')
  await Explorer.shouldHaveItem('copy2.txt')
  
  // Test concurrent move operations
  await Terminal.execute('mv folder1/file1.txt folder2/moved1.txt &')
  await Terminal.execute('mv folder1/file3.txt folder2/moved3.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify moves are reflected
  await Explorer.collapse('folder2')
  await Explorer.expand('folder1')
  await Explorer.not.toHaveItem('file1.txt')
  await Explorer.not.toHaveItem('file3.txt')
  
  await Explorer.collapse('folder1')
  await Explorer.expand('folder2')
  await Explorer.shouldHaveItem('moved1.txt')
  await Explorer.shouldHaveItem('moved3.txt')
  
  // Test concurrent delete operations
  await Terminal.execute('rm renamed-file1.txt &')
  await Terminal.execute('rm folder1/copy1.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify deletions are reflected
  await Explorer.collapse('folder2')
  await Explorer.not.toHaveItem('renamed-file1.txt')
  await Explorer.expand('folder1')
  await Explorer.not.toHaveItem('copy1.txt')
  
  // Test creating and immediately modifying files
  await Terminal.execute('echo "initial" > temp-file.txt')
  await Terminal.execute('echo "modified" > temp-file.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify file exists and was modified
  await Explorer.collapse('folder1')
  await Explorer.shouldHaveItem('temp-file.txt')
  
  // Test concurrent folder operations
  await Terminal.execute('mkdir concurrent-folder1 concurrent-folder2 &')
  await Terminal.execute('echo "content" > concurrent-folder1/file.txt &')
  await Terminal.execute('echo "content" > concurrent-folder2/file.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify folders and files appear
  await Explorer.shouldHaveItem('concurrent-folder1')
  await Explorer.shouldHaveItem('concurrent-folder2')
  
  await Explorer.expand('concurrent-folder1')
  await Explorer.shouldHaveItem('file.txt')
  
  await Explorer.collapse('concurrent-folder1')
  await Explorer.expand('concurrent-folder2')
  await Explorer.shouldHaveItem('file.txt')
  
  // Test rapid file creation and deletion
  await Terminal.execute('for i in {1..10}; do touch "rapid$i.txt" && rm "rapid$i.txt" & done')
  await Terminal.execute('sleep 0.2')
  
  // Verify no rapid files remain
  await Explorer.collapse('concurrent-folder2')
  await Explorer.not.toHaveItem('rapid1.txt')
  await Explorer.not.toHaveItem('rapid5.txt')
  await Explorer.not.toHaveItem('rapid10.txt')
  
  // Test concurrent operations on same file (should handle gracefully)
  await Terminal.execute('echo "content1" > conflict-file.txt &')
  await Terminal.execute('echo "content2" > conflict-file.txt &')
  await Terminal.execute('sleep 0.1')
  
  // Verify file exists (last write wins)
  await Explorer.shouldHaveItem('conflict-file.txt')
  
  // Test concurrent folder rename
  await Terminal.execute('mv concurrent-folder1 renamed-concurrent-folder1 &')
  await Terminal.execute('mv concurrent-folder2 renamed-concurrent-folder2 &')
  await Terminal.execute('sleep 0.1')
  
  // Verify folder renames
  await Explorer.not.toHaveItem('concurrent-folder1')
  await Explorer.not.toHaveItem('concurrent-folder2')
  await Explorer.shouldHaveItem('renamed-concurrent-folder1')
  await Explorer.shouldHaveItem('renamed-concurrent-folder2')
  
  // Verify contents are still accessible
  await Explorer.expand('renamed-concurrent-folder1')
  await Explorer.shouldHaveItem('file.txt')
}
