import { join } from 'path'
import * as KeyBindings from '../KeyBindings/KeyBindings.ts'
import * as Server from '../Server/Server.ts'
import { URL } from 'url'
import { root } from '../Root/Root.ts'
import { rm } from 'fs/promises'
import assert from 'assert'

export const create = ({ expect, page, VError }) => {
  const servers: Record<number, Server.ServerInfo> = Object.create(null)
  return {
    async createMCPServer(): Promise<Server.ServerInfo> {
      const path = '/mcp'
      const server = Server.create({ VError })
      const requests: any[] = []
      const requestHandler = (req, res) => {
        requests.push({
          url: req.url,
        })
        const parsedUrl = new URL(req.url || '', 'http://localhost')

        if (parsedUrl.pathname === path) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          })

          if (req.method === 'OPTIONS') {
            res.end()
            return
          }

          const response = {
            jsonrpc: '2.0',
            id: 1,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {
                  listChanged: true,
                },
                resources: {
                  subscribe: true,
                  listChanged: true,
                },
                prompts: {
                  listChanged: true,
                },
              },
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
    async addServer({ serverName }: { serverName: string }) {
      try {
        const server = await this.createMCPServer()
        const id = Math.random()
        servers[id] = server
        const serverUrl = server.url
        // Step 1: Open QuickPick and search for MCP commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
          waitFor: quickPick,
        })
        await expect(quickPick).toBeVisible({ timeout: 10_000 })

        const quickPickInput = quickPick.locator('[aria-autocomplete="list"]')
        await expect(quickPickInput).toBeVisible()
        await expect(quickPickInput).toBeFocused()

        // Step 2: Type "mcp" to find MCP commands
        await quickPickInput.type('mcp')

        const mcpCommands = await this.getVisibleCommands()

        // Step 4: Look for "MCP: Add Server" command
        const addServerCommand = mcpCommands.find(
          (cmd: string) => cmd.toLowerCase().includes('add server') || cmd.toLowerCase().includes('mcp: add'),
        )

        if (!addServerCommand) {
          throw new VError(new Error('MCP: Add Server command not found'), 'MCP Add Server command not available')
        }

        await this.selectCommand(addServerCommand, true)

        const serverTypeCommands = await this.getVisibleCommands()

        // Step 7: Select HTTP option for our mock server
        const httpOption = serverTypeCommands.find(
          (cmd: string) => cmd.toLowerCase().includes('http') && cmd.toLowerCase().includes('server-sent events'),
        )

        if (!httpOption) {
          throw new VError(new Error('HTTP option not found'), 'HTTP server type option not available')
        }

        await this.selectCommand(httpOption, true)
        await expect(quickPickInput).toHaveAttribute('aria-label', `URL of the MCP server (e.g., http://localhost:3000) - Enter Server URL`)
        await page.waitForIdle()
        await quickPickInput.type(`${serverUrl}/mcp`)
        await page.waitForIdle()
        await quickPickInput.press('Enter')

        await expect(quickPickInput).toHaveAttribute('aria-label', `Unique identifier for this server - Enter Server ID`)
        await page.waitForIdle()
        await quickPickInput.type(serverName)
        await page.waitForIdle()
        await quickPickInput.press('Enter')

        await expect(quickPickInput).toHaveAttribute('aria-label', `Choose where to install the MCP server`)
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

    async selectCommand(text, stayVisible = false) {
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

    async listServers() {
      try {
        // Open QuickPick and search for MCP list commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
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
          key: KeyBindings.OpenQuickPickCommands,
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

    async removeServer(serverName: string) {
      try {
        // Open QuickPick and search for MCP list commands
        await page.waitForIdle()
        const quickPick = page.locator('.quick-input-widget')
        await page.pressKeyExponential({
          key: KeyBindings.OpenQuickPickCommands,
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

    async removeAllServers() {
      try {
        for (const [key, value] of Object.entries(servers)) {
          await value.dispose()
          delete servers[key]
        }
        const storagePath = join(root, '.vscode-user-data-dir', 'User')
        const mcpPath = join(storagePath, 'mcp.json')
        await rm(mcpPath, { recursive: true, force: true })
      } catch (error) {
        throw new VError(error, `Failed to remove all MCP servers`)
      }
    },
  }
}
