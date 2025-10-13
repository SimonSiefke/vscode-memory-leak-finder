import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Terminal, Panel }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Panel.hide()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal, Editor }: TestContext): Promise<void> => {
  // Test terminal cleanup (affects process management in shared-process)
  await Terminal.show()
  await Terminal.execute('echo "terminal 1 - shared process test"')

  // Split terminal to create second terminal
  await Terminal.split()
  await Terminal.execute('echo "terminal 2 - shared process test"')

  // Kill all terminals to clean up
  await Terminal.killAll()

  // Verify terminals are closed
  await Terminal.shouldNotHaveActiveTerminals()

  // Reopen terminal to verify cleanup worked
  await Terminal.show()
  await Terminal.execute('echo "Clean terminal after shared process operations"')
  await Terminal.killAll()
}
