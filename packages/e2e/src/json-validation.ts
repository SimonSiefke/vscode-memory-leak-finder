import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const skipInCi = true

const content = JsonLanguageFeatures.document('"greeting": 42')

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'validation.json', content }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Hover, Problems, Panel, Workspace } = context
  await Editor.open('validation.json')
  try {
    await Problems.show()
    await Problems.shouldHaveCount(1)
    await Problems.shouldHaveVisibleTextCount('Incorrect type. Expected "string".', 1)
    await Editor.setCursor(3, 16)
    await Editor.hover(/Incorrect type\. Expected "string"/)
    await Hover.hide()
    await Workspace.add({ name: 'validation.json', content: JsonLanguageFeatures.document('"greeting": "hello"') })
    await Editor.shouldHaveText(JsonLanguageFeatures.document('"greeting": "hello"'))
    await Problems.shouldHaveCount(0)
    // Restore the saved document so every iteration starts from the same invalid value.
    await Workspace.add({ name: 'validation.json', content })
    await Editor.shouldHaveText(content)
    await Problems.shouldHaveCount(1)
  } finally {
    await Panel.hide()
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
