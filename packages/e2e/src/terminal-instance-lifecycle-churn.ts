import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Panel, Terminal }: TestContext): Promise<void> => {
  await Panel.hide()
  await Terminal.killAll()
}

export const run = async ({ Panel, Terminal }: TestContext): Promise<void> => {
  try {
    await Terminal.show()
    await Terminal.split()
    await Terminal.openFind()
    await Terminal.closeFind()
    await Terminal.killSecond()
  } finally {
    await Terminal.killAll()
    await Panel.hide()
  }
}

export const teardown = async ({ Panel, Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Panel.hide()
}
