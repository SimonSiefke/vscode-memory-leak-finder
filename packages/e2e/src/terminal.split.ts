import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({ Terminal }: TestContext): Promise<void> => {
  await Terminal.split()
  await Terminal.killSecond()
}
