import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Terminal }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal, Editor }: TestContext): Promise<void> => {
  // Test terminal focus switching (affects process management in shared-process)
  await Terminal.show()
  await Terminal.execute('echo "terminal 1 - shared process test"')

  // Split terminal to create second terminal
  await Terminal.split()
  await Terminal.execute('echo "terminal 2 - shared process test"')

  // Switch between terminals
  await Terminal.focusFirst()
  await Terminal.execute('echo "Back to terminal 1"')

  await Terminal.focusSecond()
  await Terminal.execute('echo "Back to terminal 2"')

  // Kill all terminals to clean up
  await Terminal.killAll()
}
