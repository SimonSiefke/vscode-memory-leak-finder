// Test file to verify that the readonly types work correctly
import type { PageObjectApi, Editor, Workspace, PageObjectContext } from './types/pageobject-api'

// Example function that uses the readonly typed API
export const testReadonlyApi = async (api: PageObjectApi): Promise<void> => {
  // These should work with readonly methods
  await api.Editor.open('test.txt')
  await api.Editor.type('Hello World')
  await api.Editor.shouldHaveText('Hello World')
  await api.Editor.save({})
  
  await api.Workspace.setFiles([
    { name: 'file1.txt', content: 'content1' },
    { name: 'file2.txt', content: 'content2' }
  ])
  
  await api.Workbench.shouldBeVisible()
  
  // Test some other parts
  await api.Panel.toggle()
  await api.QuickPick.executeCommand('some.command')
  await api.Problems.show()
  await api.ChatEditor.sendMessage('test message')
}

// Example of how the create function should be typed
export const createTypedPageObject = async (context: PageObjectContext): Promise<PageObjectApi> => {
  // This would be the actual implementation
  return {} as PageObjectApi
}
