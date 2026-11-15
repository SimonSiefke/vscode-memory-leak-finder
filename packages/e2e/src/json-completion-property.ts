import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const skipInCi = true

const content = JsonLanguageFeatures.document('"gre"')

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'completion.json', content }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Suggest } = context
  await Editor.open('completion.json')
  try {
    await Editor.setCursor(3, 7)
    await Suggest.open('greeting, Property')
    await Suggest.accept('greeting, Property')
    await Editor.press('Escape')
    await Editor.shouldHaveText(JsonLanguageFeatures.document('"greeting": "hello"'))
    await Editor.undo()
    await Editor.shouldHaveText(content)
  } finally {
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
