import type { TestContext } from '../types.ts'

export const skip = process.platform === 'win32'

export const setup = async ({ Terminal, Panel }: TestContext): Promise<void> => {
  await Panel.hide()
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.add()
  await Terminal.killSecond()
}
