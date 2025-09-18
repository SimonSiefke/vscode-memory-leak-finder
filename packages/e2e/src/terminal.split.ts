import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Terminal, Panel  }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Terminal.show()
}

export const run = async ({  Terminal  }: TestContext): Promise<void> => {
  await Terminal.split()
  await Terminal.killSecond()
}
