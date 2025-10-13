import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Terminal, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // Test terminal command execution (affects shared-process)
  await Terminal.show()
  await Terminal.execute('echo "Current directory: $(pwd)"')
  await Terminal.execute('echo "Process count: $(ps aux | wc -l)"')
  await Terminal.execute('echo "Memory usage: $(free -h | head -2)"')
  await Terminal.execute('ls -la')
  await Terminal.execute('echo "Environment variables:" && env | head -5')

  await Terminal.killAll()
}
