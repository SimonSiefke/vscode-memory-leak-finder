import assert from 'node:assert'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { URL } from 'node:url'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as KeyBindings from '../KeyBindings/KeyBindings.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import { root } from '../Root/Root.ts'
import * as Server from '../Server/Server.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const servers: Record<number, Server.ServerInfo> = Object.create(null)
  return {
    async addServer({ serverName }: { serverName: string }) {
      try {
        const server = await this.createMCPServer()
        const id = Math.random()
        servers[id] = server
        const serverUrl = server.url
        // Step 1: Open QuickPick and search for MCP commands
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.McpAddServer, {
          pressKeyOnce: true,
          stayVisible: true,
        })

        const serverTypeCommands = await this.getVisibleCommands()

        // Step 7: Select HTTP option for our mock server
        const httpOption = serverTypeCommands.find(
          (cmd: string) => cmd.toLowerCase().includes('http') && cmd.toLowerCase().includes('server-sent events'),
        )

        if (!httpOption) {
          throw new VError(new Error('HTTP option not found'), 'HTTP server type option not available')
        }

        await this.selectCommand(httpOption, true)

        const quickPickLocator = page.locator('.quick-input-widget')
        const quickPickInput = quickPickLocator.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toHaveAttribute('aria-label', `URL of the MCP server (e.g., http://localhost:3000) - Enter Server URL`)
        await page.waitForIdle()
        await quickPickInput.type(`${serverUrl}/mcp`)
        await page.waitForIdle()
        await quickPick.pressEnter()

        // if (ideVersion && ideVersion.minor <= 80) {
        await expect(quickPickInput).toHaveAttribute('aria-label', `Unique identifier for this server - Enter Server ID`)
        // } else {
        //   await expect(quickPickInput).toHaveAttribute(
        //     'aria-label',
        //     `URL of the MCP server (e.g., http://localhost:3000) - Enter Server URL`,
        //   )
        // }
        await page.waitForIdle()
        await quickPickInput.clear()
        await page.waitForIdle()
        await quickPick.type(serverName)
        await page.waitForIdle()
        await quickPick.pressEnter()

        await expect(quickPickInput).toHaveAttribute('aria-label', `Select the configuration target - Add MCP Server`)
        await this.selectCommand('Global')

        await page.waitForIdle()
        const mcpJsonFile = page.locator('[data-resource-name="mcp.json"]')
        await expect(mcpJsonFile).toBeVisible()
        await page.waitForIdle()
        const codeLens = page.locator('.codelens-decoration')
        await expect(codeLens).toBeVisible()
        const firstButton = codeLens.locator('[role="button"]').nth(0)
        await expect(firstButton).toBeVisible()
        await expect(firstButton).toHaveText(` Running`)
        assert.deepStrictEqual(server.requests, [{ url: '/mcp' }, { url: '/mcp' }, { url: '/mcp' }, { url: '/mcp' }, { url: '/mcp' }])
      } catch (error) {
        throw new VError(error, `Failed to add MCP server`)
      }
    },
    async createMCPServer(): Promise<Server.ServerInfo> {
      const path = '/mcp'
      const server = Server.create({ electronApp, expect, ideVersion, page, platform, VError })
      const requests: any[] = []
      const requestHandler = (req: any, res: any) => {
        requests.push({
          url: req.url,
        })
        const parsedUrl = new URL(req.url || '', 'http://localhost')

        if (parsedUrl.pathname === path) {
          res.writeHead(200, {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          })

          if (req.method === 'OPTIONS') {
            res.end()
            return
          }

          const response = {
            id: 1,
            jsonrpc: '2.0',
            result: {
              capabilities: {
                prompts: {
                  listChanged: true,
                },
                resources: {
                  listChanged: true,
                  subscribe: true,
                },
                tools: {
                  listChanged: true,
                },
              },
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: 'mock-mcp-server',
                version: '1.0.0',
              },
            },
          }

          res.end(JSON.stringify(response))
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Not found' }))
        }
      }
      const instance = await server.start({
        port: 0,
        requestHandler,
      })
      // @ts-ignore
      instance.requests = requests
      return instance
    },

    async getInputValue() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        return (await quickPickInput.getAttribute('value')) || ''
      } catch (error) {
        throw new VError(error, `Failed to get input value`)
      }
    },

    async getVisibleCommands() {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const commandElements = quickPick.locator('.monaco-list-row .label-name')
        const count = await commandElements.count()
        const commands: string[] = []
        for (let i = 0; i < count; i++) {
          const text = await commandElements.nth(i).textContent()
          if (text) {
            commands.push(text)
          }
        }
        return commands
      } catch (error) {
        throw new VError(error, `Failed to get visible commands`)
      }
    },

    async listServers() {
      try {
        // Open QuickPick and search for MCP list commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.getOpenQuickPickCommands(platform),
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Look for "MCP: List Servers" command
        const mcpCommands = await this.getVisibleCommands()
        const listServersCommand = mcpCommands.find(
          (cmd: string) => cmd.toLowerCase().includes('list servers') || cmd.toLowerCase().includes('mcp: list'),
        )

        if (!listServersCommand) {
          throw new VError(new Error('MCP: List Servers command not found'), 'MCP List Servers command not available')
        }

        await this.selectCommand(listServersCommand, true)
      } catch (error) {
        throw new VError(error, `Failed to list MCP servers`)
      }
    },

    async openConfiguration() {
      try {
        // Open QuickPick and search for MCP configuration commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.getOpenQuickPickCommands(platform),
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Look for MCP configuration commands
        const mcpCommands = await this.getVisibleCommands()
        const configCommand = mcpCommands.find(
          (cmd: string) => cmd.toLowerCase().includes('open') && cmd.toLowerCase().includes('configuration'),
        )

        if (!configCommand) {
          throw new VError(new Error('MCP configuration command not found'), 'MCP configuration command not available')
        }

        await this.selectCommand(configCommand, true)
      } catch (error) {
        throw new VError(error, `Failed to open MCP configuration`)
      }
    },

    async removeAllServers() {
      try {
        for (const [key, value] of Object.entries(servers)) {
          await value.dispose()
          delete servers[Number.parseInt(key)]
        }
        const storagePath = join(root, '.vscode-user-data-dir', 'User')
        const mcpPath = join(storagePath, 'mcp.json')
        await rm(mcpPath, { force: true, recursive: true })
      } catch (error) {
        throw new VError(error, `Failed to remove all MCP servers`)
      }
    },

    async removeServer(serverName: string) {
      try {
        // Open QuickPick and search for MCP list commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.getOpenQuickPickCommands(platform),
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        // Look for "MCP: List Servers" command
        const mcpCommands = await this.getVisibleCommands()
        const listServersCommand = mcpCommands.find(
          (cmd: string) => cmd.toLowerCase().includes('list servers') || cmd.toLowerCase().includes('mcp: list'),
        )

        if (!listServersCommand) {
          throw new VError(new Error('MCP: List Servers command not found'), 'MCP List Servers command not available')
        }

        await this.selectCommand(listServersCommand, true)

        await new Promise((resolve) => setTimeout(resolve, 2000))

        const serverCommands = await this.getVisibleCommands()
        const serverToRemove = serverCommands.find((cmd: string) => cmd.toLowerCase().includes(serverName.toLowerCase()))

        if (serverToRemove) {
          const serverElement = quickPick.locator('.monaco-list-row .label-name', {
            hasExactText: serverToRemove,
          })
          await serverElement.click({ button: 'right' })

          await new Promise((resolve) => setTimeout(resolve, 1000))

          const contextCommands = await this.getVisibleCommands()
          const removeCommand = contextCommands.find(
            (cmd: string) =>
              cmd.toLowerCase().includes('remove') || cmd.toLowerCase().includes('delete') || cmd.toLowerCase().includes('uninstall'),
          )

          if (removeCommand) {
            await this.selectCommand(removeCommand)
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to remove MCP server "${serverName}"`)
      }
    },

    async selectCommand(text: string, stayVisible = false) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const option = quickPick.locator('.label-name', {
          hasExactText: text,
        })
        await option.click()
        if (!stayVisible) {
          await expect(quickPick).toBeHidden()
        }
      } catch (error) {
        throw new VError(error, `Failed to select command "${text}"`)
      }
    },
  }
}
