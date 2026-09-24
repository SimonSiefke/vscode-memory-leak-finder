import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.show()
  await Terminal.split()
  await Terminal.killSecond()
  await Terminal.killAll()
}
