import type { TestContext } from '../types.ts'

// export const skip = 1

// export const requiresNetwork = 1

export const setup = async ({ SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
}

export const run = async ({ ProcessExplorer }: TestContext): Promise<void> => {
  const processExplorer = await ProcessExplorer.show()
  await processExplorer.shouldBeVisible()
  await processExplorer.close()
}
