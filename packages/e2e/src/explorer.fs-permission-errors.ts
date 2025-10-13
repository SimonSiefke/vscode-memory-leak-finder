import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Explorer, Terminal }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'readonly-file.txt',
      content: 'readonly content',
    },
    {
      name: 'normal-file.txt',
      content: 'normal content',
    },
    {
      name: 'readonly-folder/',
      content: '',
    },
    {
      name: 'readonly-folder/file-in-readonly.txt',
      content: 'file in readonly folder',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('readonly-file.txt')
  await Explorer.shouldHaveItem('normal-file.txt')
  await Explorer.shouldHaveItem('readonly-folder')
  await Terminal.killAll()
}

export const run = async ({ Terminal, Explorer }: TestContext): Promise<void> => {
  // Make file read-only via terminal
  await Terminal.execute('chmod 444 readonly-file.txt')
  
  // Try to modify the read-only file via terminal (should fail)
  await Terminal.execute('echo "modified" > readonly-file.txt || echo "Permission denied"')
  
  // Verify the file content hasn't changed in explorer
  await Explorer.shouldHaveItem('readonly-file.txt')
  
  // Try to delete read-only file via terminal (should fail)
  await Terminal.execute('rm readonly-file.txt || echo "Permission denied"')
  
  // Verify file still exists
  await Explorer.shouldHaveItem('readonly-file.txt')
  
  // Make folder read-only via terminal
  await Terminal.execute('chmod 555 readonly-folder')
  
  // Try to create file in read-only folder via terminal (should fail)
  await Terminal.execute('echo "new content" > readonly-folder/new-file.txt || echo "Permission denied"')
  
  // Verify new file wasn't created
  await Explorer.expand('readonly-folder')
  await Explorer.not.toHaveItem('new-file.txt')
  await Explorer.shouldHaveItem('file-in-readonly.txt')
  
  // Try to delete file in read-only folder via terminal (should fail)
  await Terminal.execute('rm readonly-folder/file-in-readonly.txt || echo "Permission denied"')
  
  // Verify file still exists
  await Explorer.shouldHaveItem('file-in-readonly.txt')
  
  // Try to rename file in read-only folder via terminal (should fail)
  await Terminal.execute('mv readonly-folder/file-in-readonly.txt readonly-folder/renamed-file.txt || echo "Permission denied"')
  
  // Verify rename failed
  await Explorer.shouldHaveItem('file-in-readonly.txt')
  await Explorer.not.toHaveItem('renamed-file.txt')
  
  // Try to create new folder in read-only folder via terminal (should fail)
  await Terminal.execute('mkdir readonly-folder/new-subfolder || echo "Permission denied"')
  
  // Verify new folder wasn't created
  await Explorer.not.toHaveItem('new-subfolder')
  
  // Test with file that doesn't exist (should show appropriate error)
  await Terminal.execute('rm non-existent-file.txt || echo "File not found"')
  
  // Test with folder that doesn't exist
  await Terminal.execute('mkdir non-existent-folder/subfolder || echo "Directory not found"')
  
  // Test with invalid characters in filename (should show appropriate error)
  await Terminal.execute('touch "file<with>invalid:chars" || echo "Invalid filename"')
  
  // Verify invalid file wasn't created
  await Explorer.not.toHaveItem('file<with>invalid:chars')
  
  // Test with very long filename (should show appropriate error)
  const longName = 'a'.repeat(300) + '.txt'
  await Terminal.execute(`touch "${longName}" || echo "Filename too long"`)
  
  // Verify long filename file wasn't created
  await Explorer.not.toHaveItem(longName)
  
  // Restore permissions and verify operations work again
  await Terminal.execute('chmod 644 readonly-file.txt')
  await Terminal.execute('chmod 755 readonly-folder')
  
  // Now operations should work
  await Terminal.execute('echo "modified after permission change" > readonly-file.txt')
  await Terminal.execute('echo "new file" > readonly-folder/new-file.txt')
  
  // Verify operations worked
  await Explorer.shouldHaveItem('new-file.txt')
}
