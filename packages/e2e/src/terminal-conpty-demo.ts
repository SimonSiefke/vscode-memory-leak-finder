import type { TestContext } from '../types.ts'
import * as TerminalSplit from './terminal-split.ts'

export const skip = true

export const setup = async (context: TestContext): Promise<void> => {
  await TerminalSplit.setup(context)
  await context.Notification.closeAll({ force: true })
}

// The same split/dispose actions as terminal-split, paced for a human-readable recording.
export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.split()
  await new Promise((resolve) => setTimeout(resolve, 1500))
  await Terminal.killSecond()
  await new Promise((resolve) => setTimeout(resolve, 1500))
}
