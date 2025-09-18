import type { TestContext } from '../types.js'

export const setup = async ({  Extensions  }: TestContext): Promise<void> => {
  await Extensions.show()
  await Extensions.search('@mcp')
  await Extensions.shouldHaveMcpWelcomeHeading('MCP Servers')
  await Extensions.shouldHaveTitle('Extensions: MCP Servers')
}

export const run = async ({  Extensions  }: TestContext): Promise<void> => {
  await Extensions.search('')
  await Extensions.shouldHaveTitle('Extensions')
  await Extensions.search('@mcp')
  await Extensions.shouldHaveMcpWelcomeHeading('MCP Servers')
  await Extensions.shouldHaveTitle('Extensions: MCP Servers')
  await Extensions.search('')
  await Extensions.shouldHaveTitle('Extensions')
}
