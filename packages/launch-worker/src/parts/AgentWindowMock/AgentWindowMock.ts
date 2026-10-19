import { randomUUID } from 'node:crypto'
import { createServer, type ServerResponse } from 'node:http'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export const modelId = 'gpt-5.3-codex'
export const reply = 'Hello from the mocked Agents window.'
const token = 'agents-window-test-token'

const model = {
  id: modelId,
  name: 'Agents Test Model',
  object: 'model',
  version: modelId,
  vendor: 'OpenAI',
  model_picker_enabled: true,
  is_chat_default: true,
  is_chat_fallback: true,
  preview: false,
  capabilities: {
    type: 'chat',
    family: modelId,
    tokenizer: 'o200k_base',
    object: 'model_capabilities',
    limits: { max_prompt_tokens: 272000, max_output_tokens: 128000, max_context_window_tokens: 400000 },
    supports: { streaming: true, tool_calls: true, parallel_tool_calls: true, vision: false },
  },
  supported_endpoints: ['/responses'],
}

const streamResponse = (res: ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' })
  let sequence = 0
  const event = (type: string, data: object) => res.write(`data: ${JSON.stringify({ type, sequence_number: sequence++, ...data })}\n\n`)
  const response = { id: `resp_${randomUUID()}`, object: 'response', created_at: Math.floor(Date.now() / 1000), model: modelId }
  const item = { id: `msg_${randomUUID()}`, type: 'message', role: 'assistant' }
  const position = { item_id: item.id, output_index: 0, content_index: 0 }
  const part = { type: 'output_text', text: reply, annotations: [] }
  const output = { ...item, status: 'completed', content: [part] }
  event('response.created', { response: { ...response, status: 'in_progress', output: [], usage: null } })
  event('response.output_item.added', { output_index: 0, item: { ...item, status: 'in_progress', content: [] } })
  event('response.content_part.added', { ...position, part: { ...part, text: '' } })
  event('response.output_text.delta', { ...position, delta: reply })
  event('response.output_text.done', { ...position, text: reply })
  event('response.content_part.done', { ...position, part })
  event('response.output_item.done', { output_index: 0, item: output })
  event('response.completed', {
    response: {
      ...response,
      status: 'completed',
      output: [output],
      usage: {
        input_tokens: 10,
        output_tokens: 10,
        total_tokens: 20,
        input_tokens_details: { cached_tokens: 0 },
        output_tokens_details: { reasoning_tokens: 0 },
      },
    },
  })
  res.end()
}

// Use the real agent host and SDK, replacing only their HTTP backend. Bind to
// loopback and never forward requests or require real credentials.
export const start = async (userDataDir: string) => {
  const savedSettings = new Map<string, string | undefined>()
  const server = createServer(async (req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname
    const json = (status: number, value: unknown) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...(status >= 400 ? { 'x-should-retry': 'false' } : {}) })
      res.end(JSON.stringify(value))
    }
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 4 * 1024 * 1024) {
          json(413, { error: 'Mock request too large' })
          return
        }
        chunks.push(chunk)
      }
      if (req.method === 'GET' && path === '/copilot_internal/user') {
        json(200, {
          login: 'agents-test',
          copilot_plan: 'individual_pro',
          chat_enabled: true,
          cli_enabled: true,
          is_mcp_enabled: false,
          organization_login_list: [],
          organization_list: [],
          endpoints: { api: url, proxy: url, telemetry: url },
        })
      } else if (path === '/copilot_internal/v2/token' || path === '/copilot_internal/v2/nltoken') {
        json(200, { token, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_in: 1800, endpoints: { api: url, proxy: url } })
      } else if (path.startsWith('/copilot_internal/')) {
        json(200, {})
      } else if (path === '/copilot/mcp_registry') {
        json(200, { mcp_registries: [] })
      } else if (req.method === 'GET' && path === '/models') {
        // The shared endpoint serves both the SDK chat catalog and the
        // extension proxy catalog. Inline-edit models are outside this fixture.
        json(200, { data: [model], models: [] })
      } else if (req.method === 'GET' && path === `/models/${modelId}`) {
        json(200, model)
      } else if (path === '/models/session') {
        json(200, {
          available_models: [modelId],
          selected_model: modelId,
          session_token: token,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          discounted_costs: {},
        })
      } else if (path === '/models/session/intent') {
        json(200, { model: modelId })
      } else if (req.method === 'POST' && path === '/responses') {
        JSON.parse(Buffer.concat(chunks).toString())
        streamResponse(res)
      } else if (req.method === 'GET' && (path === '/agents' || path.startsWith('/agents/swe/custom-agents'))) {
        json(200, { agents: [] })
      } else if (req.method === 'GET' && path === '/agents/swe/models') {
        json(200, { data: [model] })
      } else if (path.endsWith('/policy')) {
        json(200, { state: 'accepted', terms: '' })
      } else if (path === '/telemetry') {
        json(200, {})
      } else {
        json(404, { error: `Unmocked Agents request: ${req.method} ${path}` })
      }
    } catch {
      if (!res.headersSent) json(400, { error: 'Invalid Agents mock request' })
      else res.end()
    }
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Agents mock server did not bind a port')
  const url = `http://127.0.0.1:${address.port}`
  let disposed = false
  const dispose = async () => {
    if (disposed) return
    disposed = true
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
    for (const [path, original] of savedSettings) {
      if (original === undefined) await rm(path, { force: true })
      else await writeFile(path, original)
    }
  }
  try {
    const settings = {
      'window.menuStyle': 'custom',
      'chat.allowAnonymousAccess': true,
      'chat.agentHost.unsafeTestToken': token,
      'chat.defaultModel': modelId,
      'chat.agentHost.codexAgent.enabled': false,
      'chat.agentHost.claudeAgent.enabled': false,
      'github.copilot.chat.githubMcpServer.enabled': false,
      'github.copilot.advanced.debug.overrideProxyUrl': url,
      'sessions.useWorktree': false,
      'sessions.chat.unifiedWorkspacePicker.enabled': true,
    }
    for (const relativePath of ['User/settings.json', 'User/profiles/builtin/agents/settings.json']) {
      const path = join(userDataDir, relativePath)
      const original = await readFile(path, 'utf8').catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined
        throw error
      })
      savedSettings.set(path, original)
      const existing = original === undefined ? {} : JSON.parse(original)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, JSON.stringify({ ...existing, ...settings }, null, 2))
    }
    const stateHome = join(userDataDir, 'agents-test-state')
    const copilotHome = join(stateHome, '.copilot')
    await mkdir(copilotHome, { recursive: true })
    await mkdir(join(stateHome, '.codex'), { recursive: true })
    return {
      dispose,
      env: {
        COPILOT_API_URL: url,
        COPILOT_DEBUG_GITHUB_API_URL: url,
        VSCODE_AGENT_HOST_CAPI_URL_OVERRIDE: url,
        GITHUB_COPILOT_API_TOKEN: token,
        GITHUB_PAT: 'agents-window-test-pat',
        IS_SCENARIO_AUTOMATION: '1',
        VSCODE_COPILOT_CHAT_TOKEN: Buffer.from(
          JSON.stringify({
            token,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_in: 1800,
            sku: 'free_limited_copilot',
            individual: true,
            isNoAuthUser: true,
            copilot_plan: 'free',
            organization_login_list: [],
            endpoints: { api: url, proxy: url },
          }),
        ).toString('base64'),
        XDG_STATE_HOME: stateHome,
        COPILOT_HOME: copilotHome,
        CODEX_HOME: join(stateHome, '.codex'),
      },
    }
  } catch (error) {
    await dispose()
    throw error
  }
}
