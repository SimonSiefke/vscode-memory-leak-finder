import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

const content = `{
  // Application options.
  "$schema": "./features.schema.json",
  "tone": "",
}`

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'completion.jsonc', content }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Suggest } = context
  await Editor.open('completion.jsonc')
  try {
    await Editor.setCursor(4, 12)
    await Suggest.open('"friendly", Value')
    await Suggest.accept('"friendly", Value')
    await Editor.shouldHaveText(content.replace('"tone": ""', '"tone": "friendly"'))
    await Editor.shouldNotHaveSquigglyError()
    await Editor.undo()
    await Editor.shouldHaveText(content)
  } finally {
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
