import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

export const skip = 1
export const skipInCi = true

const content = `{
  "definitions": {
    "greeting": {
      "type": "string"
    }
  },
  "$ref": "#/definitions/greeting"
}`

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'reference.json', content }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor } = context
  await Editor.open('reference.json')
  try {
    await Editor.setCursor(7, 15)
    // JSON provides navigation for $ref through document links, rather than a definition provider.
    await Editor.clickLink('#/definitions/greeting')
    await Editor.shouldHaveActiveLineNumber(3)
    await Editor.shouldHaveBreadCrumb('greeting')
  } finally {
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
