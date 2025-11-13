import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Terminal, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await Terminal.killAll()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  // Test terminal creation and splitting (affects process management in shared-process)
  await Terminal.show()
  await Terminal.execute('echo "terminal 1 - shared process test"')

  // Split terminal to create second terminal
  await Terminal.split()
  await Terminal.execute('echo "terminal 2 - shared process test"')

  // Create a third terminal
  await Terminal.split()
  await Terminal.execute('echo "terminal 3 - shared process test"')
  await Terminal.killThird()

  // Kill all terminals to clean up
  await Terminal.killAll()
}
