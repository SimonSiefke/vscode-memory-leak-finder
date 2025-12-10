import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import * as Root from '../Root/Root.ts'

const PROXY_STATE_FILE = join(Root.root, '.vscode-proxy-state.json')

export interface ProxyState {
  proxyUrl: string | null
  port: number | null
}

export const getProxyState = async (): Promise<ProxyState> => {
  if (existsSync(PROXY_STATE_FILE)) {
    try {
      const content = await readFile(PROXY_STATE_FILE, 'utf8')
      return JSON.parse(content)
    } catch {
      return { proxyUrl: null, port: null }
    }
  }
  return { proxyUrl: null, port: null }
}

export const setProxyState = async (state: ProxyState): Promise<void> => {
  await writeFile(PROXY_STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
}

export const clearProxyState = async (): Promise<void> => {
  if (existsSync(PROXY_STATE_FILE)) {
    const { unlink } = await import('fs/promises')
    await unlink(PROXY_STATE_FILE)
  }
}
