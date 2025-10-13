import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Terminal }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal, Editor }: TestContext): Promise<void> => {
  // Create multiple terminals (affects process management in shared-process)
  await Terminal.show()
  await Terminal.execute('echo "terminal 1 - shared process test"')
  
  // Split terminal to create second terminal
  await Terminal.split()
  await Terminal.execute('echo "terminal 2 - shared process test"')
  
  // Execute commands that might affect shared-process
  await Terminal.execute('echo "Current directory: $(pwd)"')
  await Terminal.execute('echo "Process count: $(ps aux | wc -l)"')
  await Terminal.execute('echo "Memory usage: $(free -h | head -2)"')
  
  // Switch between terminals
  await Terminal.focusFirst()
  await Terminal.execute('echo "Back to terminal 1"')
  
  await Terminal.focusSecond()
  await Terminal.execute('echo "Back to terminal 2"')
  
  // Execute more commands to increase shared-process activity
  await Terminal.execute('ls -la')
  await Terminal.execute('echo "Environment variables:" && env | head -5')
  
  // Create a third terminal if possible
  try {
    await Terminal.split()
    await Terminal.execute('echo "terminal 3 - shared process test"')
    await Terminal.killThird()
  } catch (error) {
    // Third terminal might not be supported, continue
  }
  
  // Kill all terminals to clean up
  await Terminal.killAll()
  
  // Verify terminals are closed
  await Terminal.shouldNotHaveActiveTerminals()
  
  // Reopen terminal to verify cleanup worked
  await Terminal.show()
  await Terminal.execute('echo "Clean terminal after shared process operations"')
  await Terminal.killAll()
}

