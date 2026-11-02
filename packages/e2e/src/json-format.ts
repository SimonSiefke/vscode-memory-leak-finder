import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

const content = '{"greeting":"hello","tone":"friendly"}'

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'format.json', content }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor } = context
  await Editor.open('format.json')
  try {
    await Editor.format()
    await Editor.shouldHaveText('{\n  "greeting": "hello",\n  "tone": "friendly"\n}')
    await Editor.undo()
    await Editor.shouldHaveText(content)
  } finally {
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
