import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

export const setup = async (context: TestContext): Promise<void> => {
  await JsonLanguageFeatures.setup(context, [{ name: 'symbols.json', content: '{\n  "greeting": "hello",\n  "tone": "friendly"\n}' }])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, QuickPick } = context
  await Editor.open('symbols.json')
  try {
    await Editor.setCursor(1, 1)
    await QuickPick.show()
    await QuickPick.type('@tone')
    const label = await QuickPick.getFocusedItemLabel()
    if (label.trim() !== 'tone') {
      throw new Error(`Expected the tone document symbol, got ${JSON.stringify(label)}`)
    }
    await QuickPick.pressEnter()
    await Editor.shouldHaveActiveLineNumber(3)
    await Editor.shouldHaveBreadCrumb('tone')
  } finally {
    await JsonLanguageFeatures.closeDocument(context)
  }
}

export const teardown = JsonLanguageFeatures.teardown
