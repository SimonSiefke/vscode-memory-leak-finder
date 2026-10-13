import WebSocket from 'ws'
import { setTimeout as delay } from 'node:timers/promises'

export class Cdp {
  private sequence = 0
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>()
  private listeners = new Map<string, Set<(params: any) => void>>()
  private socket: WebSocket
  private constructor(socket: WebSocket) {
    this.socket = socket
    socket.on('message', (data) => {
      const message = JSON.parse(data.toString())
      if (message.id) {
        const request = this.pending.get(message.id)
        if (!request) return
        clearTimeout(request.timer)
        this.pending.delete(message.id)
        if (message.error) request.reject(new Error(JSON.stringify(message.error)))
        else request.resolve(message.result)
      } else {
        for (const listener of this.listeners.get(message.method) ?? []) listener(message.params)
      }
    })
    socket.on('close', () => this.rejectPending(new Error('DevTools connection closed')))
    socket.on('error', (error) => this.rejectPending(error))
  }
  static async connect(url: string): Promise<Cdp> {
    const socket = new WebSocket(url, { maxPayload: 256 * 1024 * 1024 })
    const connection = new Cdp(socket)
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        socket.terminate()
        reject(new Error('DevTools connection timed out'))
      }, 10000)
      socket.once('open', () => {
        clearTimeout(timer)
        resolve()
      })
      socket.once('error', (error) => {
        clearTimeout(timer)
        reject(error)
      })
    })
    return connection
  }
  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    this.pending.clear()
  }
  send<T = any>(method: string, params: object = {}, timeout = 30000): Promise<T> {
    const id = ++this.sequence
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`${method} timed out`))
      }, timeout)
      this.pending.set(id, { resolve, reject, timer })
      this.socket.send(JSON.stringify({ id, method, params }), (error) => {
        if (error) {
          clearTimeout(timer)
          this.pending.delete(id)
          reject(error)
        }
      })
    })
  }
  on(method: string, listener: (params: any) => void): () => void {
    const listeners = this.listeners.get(method) ?? new Set()
    this.listeners.set(method, listeners)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
  async evaluate<T = any>(expression: string): Promise<T> {
    const value = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description ?? value.exceptionDetails.text)
    return value.result.value as T
  }
  close(): void {
    this.rejectPending(new Error('DevTools connection disposed'))
    this.socket.terminate()
  }
  pause(): void {
    this.socket.pause()
  }
  resume(): void {
    this.socket.resume()
  }
}

export const waitFor = async <T>(description: string, probe: () => Promise<T | undefined | false>, timeout = 60000): Promise<T> => {
  const deadline = Date.now() + timeout
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const value = await probe()
      if (value !== undefined && value !== false) return value
    } catch (error) {
      lastError = error
    }
    await delay(20)
  }
  throw new Error(`Timed out waiting for ${description}${lastError ? `: ${String(lastError)}` : ''}`)
}

export const connectTarget = async (port: number, inspector = false): Promise<Cdp> => {
  const url = await waitFor('VS Code DevTools endpoint', async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(2000) })
    const targets = (await response.json()) as { type: string; url: string; webSocketDebuggerUrl: string }[]
    const target = targets.find((entry) => inspector || (entry.type === 'page' && entry.url.includes('workbench')))
    return target?.webSocketDebuggerUrl
  })
  return Cdp.connect(url)
}

export const key = async (cdp: Cdp, keyName: string, code: string, keyCode: number, modifiers = 0): Promise<void> => {
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code, windowsVirtualKeyCode: keyCode, modifiers })
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, windowsVirtualKeyCode: keyCode, modifiers })
}

export const typeKeys = async (cdp: Cdp, text: string): Promise<void> => {
  // xterm consumes keyboard events; Input.insertText only changes its hidden textarea.
  for (const character of text) {
    await cdp.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: character,
      text: character,
      unmodifiedText: character,
      windowsVirtualKeyCode: character.toUpperCase().charCodeAt(0),
    })
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: character })
  }
}

export const waitExpression = (cdp: Cdp, expression: string, description = expression): Promise<true> =>
  waitFor(description, async () => ((await cdp.evaluate<boolean>(expression)) ? true : false))

export const click = async (cdp: Cdp, selector: string): Promise<void> => {
  const position = await waitFor(`visible ${selector}`, async () => {
    return cdp.evaluate<{ x: number; y: number } | undefined>(`(() => {
      const elements = [...document.querySelectorAll(${JSON.stringify(selector)})];
      const element = elements.find(e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0);
      if (!element) return undefined; const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`)
  })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...position })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...position })
}

export const palette = async (cdp: Cdp, name: string, waitHidden = true): Promise<void> => {
  await key(cdp, 'F1', 'F1', 112)
  await waitExpression(cdp, `!!document.querySelector('.quick-input-widget input')?.getBoundingClientRect().width`, 'command palette')
  await key(cdp, 'a', 'KeyA', 65, 2)
  await cdp.send('Input.insertText', { text: `>${name}` })
  await waitExpression(
    cdp,
    `!!document.querySelector('.quick-input-list .monaco-list-row')?.textContent?.includes(${JSON.stringify(name)})`,
    name,
  )
  await key(cdp, 'Enter', 'Enter', 13)
  if (waitHidden)
    await waitExpression(cdp, `!document.querySelector('.quick-input-widget')?.getBoundingClientRect().width`, 'command completion')
}
