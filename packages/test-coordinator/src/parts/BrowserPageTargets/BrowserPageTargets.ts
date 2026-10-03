interface TargetInfo {
  readonly targetId: string
  readonly type: string
}

interface TargetListResult {
  readonly targetInfos: readonly TargetInfo[]
}

interface RpcResponse {
  readonly error?: {
    readonly message?: string
  }
  readonly id: number
  readonly result?: TargetListResult
}

const getTargets = async (devtoolsWebSocketUrl: string): Promise<readonly TargetInfo[]> => {
  const webSocket = new WebSocket(devtoolsWebSocketUrl)
  const opened = Promise.withResolvers<void>()
  const response = Promise.withResolvers<RpcResponse>()

  const handleOpen = () => {
    opened.resolve()
  }
  const handleError = () => {
    opened.reject(new Error(`Failed to connect to browser devtools websocket`))
  }
  const handleMessage = (event) => {
    const message = JSON.parse(String(event.data)) as RpcResponse
    if (message.id === 0) {
      response.resolve(message)
    }
  }

  webSocket.addEventListener('open', handleOpen)
  webSocket.addEventListener('error', handleError)
  webSocket.addEventListener('message', handleMessage)

  try {
    await opened.promise
    webSocket.send(
      JSON.stringify({
        id: 0,
        method: 'Target.getTargets',
      }),
    )
    const message = await response.promise
    if (message.error) {
      throw new Error(message.error.message || 'Failed to get browser targets')
    }
    return message.result?.targetInfos || []
  } finally {
    webSocket.removeEventListener('open', handleOpen)
    webSocket.removeEventListener('error', handleError)
    webSocket.removeEventListener('message', handleMessage)
    webSocket.close()
  }
}

export const getBrowserPageTargetIds = async (devtoolsWebSocketUrl: string): Promise<readonly string[]> => {
  const targets = await getTargets(devtoolsWebSocketUrl)
  return targets.filter((target) => target.type === 'page').map((target) => target.targetId)
}
