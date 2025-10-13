import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ MCP }: TestContext): Promise<void> => {
  // Test listing MCP servers
  console.log('Testing MCP server listing...')
  
  await MCP.listServers()
  
  console.log('MCP server listing completed')
}
