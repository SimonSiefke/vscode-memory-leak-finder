import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'hover.json', content: JsonLanguageFeatures.document('"greeting": "hello"') }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Hover } = context
  await Editor.open('hover.json')
  try {
    await Editor.setCursor(3, 6)
    await Editor.hover('Greeting displayed by the application.')
    await Hover.hide()
  } finally {
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
