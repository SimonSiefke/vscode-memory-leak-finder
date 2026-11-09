import WebSocket from 'ws'

export class Inspector {
  private nextId = 0
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>()
  private socket: WebSocket
  private constructor(socket: WebSocket) {
    this.socket = socket
    socket.on('message', (data) => {
      const message = JSON.parse(data.toString())
      const request = this.pending.get(message.id)
      if (!request) return
      clearTimeout(request.timer)
      this.pending.delete(message.id)
      if (message.error) request.reject(new Error(JSON.stringify(message.error)))
      else request.resolve(message.result)
    })
    socket.on('error', (error) => this.rejectPending(error))
    socket.on('close', () => this.rejectPending(new Error('Inspector closed')))
  }
  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) {
      clearTimeout(request.timer)
      request.reject(error)
    }
    this.pending.clear()
  }
  static async connect(url: string): Promise<Inspector> {
    const socket = new WebSocket(url, { handshakeTimeout: 5000 })
    const session = new Inspector(socket)
    await new Promise<void>((resolve, reject) => {
      socket.once('open', resolve)
      socket.once('error', reject)
    })
    return session
  }
  invoke(method: string, params: object = {}): Promise<any> {
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Inspector request timed out: ${method}`))
      }, 10000)
      this.pending.set(id, { resolve, reject, timer })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }
  dispose(): void {
    this.rejectPending(new Error('Inspector disposed'))
    this.socket.terminate()
  }
}
