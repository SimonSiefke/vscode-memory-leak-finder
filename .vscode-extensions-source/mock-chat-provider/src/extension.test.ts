import * as assert from 'assert'
import * as vscode from 'vscode'

describe('Mock Chat Provider', () => {
  it('should register the mock chat provider', async () => {
    const providers = vscode.chat.providers
    assert.ok(providers.some((p) => p.id === 'mock-chat'))
  })
})
