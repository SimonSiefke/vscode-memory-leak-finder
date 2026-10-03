import type { TestContext } from '../types.ts'

export const skip = 1

const queries = ['terminal', 'format document', 'toggle sidebar']

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Editor, KeyBindingsEditor }: TestContext): Promise<void> => {
  try {
    await KeyBindingsEditor.show()
    for (const query of queries) {
      await KeyBindingsEditor.searchFor(query)
    }
    await KeyBindingsEditor.searchFor('')
  } finally {
    await Editor.close()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
