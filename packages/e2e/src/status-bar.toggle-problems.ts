import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ writeSettings }: TestContext): Promise<void> => {
  await writeSettings({
    'window.titleBarStyle': 'custom',
  })
}

export const run = async ({ StatusBar }: TestContext): Promise<void> => {
  const problems = await StatusBar.item('status.problems')
  await problems.hide()
  await problems.show()
}
