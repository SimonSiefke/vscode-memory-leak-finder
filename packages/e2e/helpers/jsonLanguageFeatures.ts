import type { TestContext } from '../types.ts'

export const schema = JSON.stringify(
  {
    type: 'object',
    properties: {
      $schema: { type: 'string' },
      greeting: { type: 'string', description: 'Greeting displayed by the application.', default: 'hello' },
      tone: { type: 'string', enum: ['friendly', 'formal'] },
    },
    additionalProperties: false,
  },
  null,
  2,
)

export const document = (property: string): string => `{\n  "$schema": "./features.schema.json",\n  ${property}\n}`

export const setup = async (context: TestContext, files: Array<{ name: string; content: string }>): Promise<void> => {
  const { Editor, Hover, Workspace } = context
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      name: '.vscode/settings.json',
      content: JSON.stringify({
        'editor.quickSuggestions': false,
        'editor.suggestOnTriggerCharacters': false,
        'editor.wordBasedSuggestions': 'off',
        'editor.tabCompletion': 'off',
        'editor.detectIndentation': false,
        'editor.insertSpaces': true,
        'editor.tabSize': 2,
        'json.schemaDownload.enable': false,
        'json.format.keepLines': false,
      }),
    },
    { name: 'features.schema.json', content: schema },
    { name: 'warmup.json', content: document('"greeting": "hello"') },
    ...files,
  ])
  // Wait for the real JSON provider and local schema before the initial heap capture.
  await Editor.open('warmup.json')
  await Editor.setCursor(3, 6)
  await Editor.shouldHaveBreadCrumb('greeting')
  await Editor.hover('Greeting displayed by the application.')
  await Hover.hide()
  await Editor.closeAll()
}

export const closeDocument = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('View: Revert and Close Editor')
  await Editor.closeAll()
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.remove('.vscode/settings.json')
}
