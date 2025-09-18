import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Terminal, Panel }: TestContext): Promise<void> => {
  await Panel.hide()
  await Terminal.killAll()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.show()
  await Terminal.killFirst()
}
