import type { TestContext } from '../types.js'

export const setup = async ({  KeyBindingsEditor  }: TestContext): Promise<void> => {
  await KeyBindingsEditor.show()
  await KeyBindingsEditor.searchFor('Copy')
}

export const run = async ({  KeyBindingsEditor  }: TestContext): Promise<void> => {
  await KeyBindingsEditor.setKeyBinding('Copy', 'Control+L')
  await KeyBindingsEditor.setKeyBinding('Copy', 'Control+C')
}
