import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'small-file.txt',
      content: 'small content',
    },
    {
      name: 'medium-file.txt',
      content: 'medium content that is a bit longer',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('small-file.txt')
  await Explorer.shouldHaveItem('medium-file.txt')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Create a large file via terminal (1MB)
  await Terminal.execute('dd if=/dev/zero of=large-file.bin bs=1024 count=1024 2>/dev/null')
  
  // Verify the large file appears in explorer
  await Explorer.shouldHaveItem('large-file.bin')
  
  // Create a very large file via terminal (10MB)
  await Terminal.execute('dd if=/dev/zero of=very-large-file.bin bs=1024 count=10240 2>/dev/null')
  
  // Verify the very large file appears in explorer
  await Explorer.shouldHaveItem('very-large-file.bin')
  
  // Create a file with many lines via terminal
  await Terminal.execute('seq 1 10000 > many-lines.txt')
  
  // Verify the many-lines file appears
  await Explorer.shouldHaveItem('many-lines.txt')
  
  // Create a file with very long lines via terminal
  await Terminal.execute('printf "%.0sx" {1..10000} > long-line.txt')
  
  // Verify the long-line file appears
  await Explorer.shouldHaveItem('long-line.txt')
  
  // Create multiple large files in a folder
  await Terminal.execute('mkdir large-files-folder')
  await Terminal.execute('dd if=/dev/zero of=large-files-folder/file1.bin bs=1024 count=1024 2>/dev/null')
  await Terminal.execute('dd if=/dev/zero of=large-files-folder/file2.bin bs=1024 count=1024 2>/dev/null')
  await Terminal.execute('dd if=/dev/zero of=large-files-folder/file3.bin bs=1024 count=1024 2>/dev/null')
  
  // Verify the folder and files appear
  await Explorer.shouldHaveItem('large-files-folder')
  await Explorer.expand('large-files-folder')
  await Explorer.shouldHaveItem('file1.bin')
  await Explorer.shouldHaveItem('file2.bin')
  await Explorer.shouldHaveItem('file3.bin')
  
  // Test copying large file
  await Terminal.execute('cp large-file.bin large-file-copy.bin')
  
  // Verify the copy appears
  await Explorer.collapse('large-files-folder')
  await Explorer.shouldHaveItem('large-file-copy.bin')
  
  // Test moving large file
  await Terminal.execute('mv very-large-file.bin large-files-folder/')
  
  // Verify the move
  await Explorer.not.toHaveItem('very-large-file.bin')
  await Explorer.expand('large-files-folder')
  await Explorer.shouldHaveItem('very-large-file.bin')
  
  // Test renaming large file
  await Terminal.execute('mv large-file.bin renamed-large-file.bin')
  
  // Verify the rename
  await Explorer.collapse('large-files-folder')
  await Explorer.not.toHaveItem('large-file.bin')
  await Explorer.shouldHaveItem('renamed-large-file.bin')
  
  // Test creating a file with special characters in name
  await Terminal.execute('dd if=/dev/zero of="file with spaces.bin" bs=1024 count=1024 2>/dev/null')
  
  // Verify file with spaces appears
  await Explorer.shouldHaveItem('file with spaces.bin')
  
  // Test creating a file with unicode characters
  await Terminal.execute('dd if=/dev/zero of="файл-с-unicode.bin" bs=1024 count=1024 2>/dev/null')
  
  // Verify unicode file appears
  await Explorer.shouldHaveItem('файл-с-unicode.bin')
  
  // Test creating many small files (stress test)
  await Terminal.execute('mkdir many-small-files')
  await Terminal.execute('for i in {1..100}; do echo "content $i" > "many-small-files/file$i.txt"; done')
  
  // Verify the folder and some files appear
  await Explorer.shouldHaveItem('many-small-files')
  await Explorer.expand('many-small-files')
  await Explorer.shouldHaveItem('file1.txt')
  await Explorer.shouldHaveItem('file50.txt')
  await Explorer.shouldHaveItem('file100.txt')
  
  // Test deleting large file
  await Terminal.execute('rm renamed-large-file.bin')
  
  // Verify large file is deleted
  await Explorer.not.toHaveItem('renamed-large-file.bin')
  
  // Test deleting folder with large files
  await Terminal.execute('rm -rf large-files-folder')
  
  // Verify folder and contents are deleted
  await Explorer.collapse('large-files-folder')
  await Explorer.not.toHaveItem('large-files-folder')
}
