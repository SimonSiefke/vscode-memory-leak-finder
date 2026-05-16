import { createHash } from 'node:crypto'

const COPILOT_HOSTNAMES = new Set(['api.githubcopilot.com', 'api.individual.githubcopilot.com'])
const COPILOT_PATHNAMES = new Set(['/chat/completions', '/responses'])
const STRIPPED_TAGS = [
  'context',
  'environment_info',
  'repoMemory',
  'reminderInstructions',
  'sessionMemory',
  'todoList',
  'userMemory',
  'workspace_info',
]
const MONTH_DATE_REGEX =
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}\b/gi
const ISO_DATE_REGEX = /\b\d{4}-\d{2}-\d{2}(?:[tT ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:[zZ]|[+-]\d{2}:?\d{2})?)?\b/g
const UUID_REGEX = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi
const LONG_HEX_REGEX = /\b[0-9a-f]{32,}\b/gi
const TIMESTAMP_REGEX = /\b\d{13,}\b/g
const SESSION_CALL_ID_REGEX = /call_[A-Za-z0-9]+__vscode-\d+/g
const LOCALHOST_URL_WITH_PORT_REGEX = /https?:\/\/(?:localhost|127\.0\.0\.1):\d+/gi
const MULTI_WHITESPACE_REGEX = /\s+/g
const COPILOT_EPHEMERAL_KEYS = new Set(['copilot_cache_control', 'id', 'tool_call_id'])

const isCopilotRequest = (hostname: string, pathname: string, method: string): boolean => {
  return method.toUpperCase() === 'POST' && COPILOT_HOSTNAMES.has(hostname) && COPILOT_PATHNAMES.has(pathname)
}

const stripTaggedBlocks = (value: string): string => {
  let strippedValue = value
  for (const tagName of STRIPPED_TAGS) {
    const regex = new RegExp(`<${tagName}>[\\s\\S]*?<\\/${tagName}>`, 'gi')
    strippedValue = strippedValue.replace(regex, ' ')
  }
  return strippedValue
}

const extractUserRequests = (value: string): readonly string[] => {
  const matches = value.matchAll(/<userRequest>([\s\S]*?)<\/userRequest>/gi)
  return Array.from(matches, (match) => match[1]?.trim() || '').filter(Boolean)
}

const normalizeText = (value: string): string => {
  const userRequests = extractUserRequests(value)
  const relevantText = userRequests.length > 0 ? userRequests.join('\n') : stripTaggedBlocks(value)
  return relevantText
    .replace(ISO_DATE_REGEX, '<date>')
    .replace(MONTH_DATE_REGEX, '<date>')
    .replace(UUID_REGEX, '<uuid>')
    .replace(LONG_HEX_REGEX, '<hex>')
    .replace(TIMESTAMP_REGEX, '<timestamp>')
    .replace(SESSION_CALL_ID_REGEX, '<session-call-id>')
    .replace(LOCALHOST_URL_WITH_PORT_REGEX, 'http://localhost:<port>')
    .replace(MULTI_WHITESPACE_REGEX, ' ')
    .trim()
}

const normalizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return normalizeText(value)
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const objectValue = value as Record<string, unknown>
  if ('role' in objectValue) {
    return normalizeMessage(objectValue)
  }

  const normalizedObject: Record<string, unknown> = {}
  const sortedKeys = Object.keys(objectValue).sort()
  for (const key of sortedKeys) {
    if (COPILOT_EPHEMERAL_KEYS.has(key)) {
      continue
    }
    const normalizedEntry = normalizeValue(objectValue[key])
    if (normalizedEntry !== undefined) {
      normalizedObject[key] = normalizedEntry
    }
  }
  return normalizedObject
}

const normalizeMessage = (message: Record<string, unknown>): Record<string, unknown> => {
  const role = message.role
  const normalizedMessage: Record<string, unknown> = {}
  if (role !== undefined) {
    normalizedMessage.role = role
  }
  for (const key of Object.keys(message).sort()) {
    if (key === 'role' || key === 'copilot_cache_control' || key === 'id' || key === 'tool_call_id') {
      continue
    }
    const normalizedEntry = normalizeValue(message[key])
    if (normalizedEntry !== undefined && normalizedEntry !== '') {
      normalizedMessage[key] = normalizedEntry
    }
  }
  return normalizedMessage
}

const normalizeMessages = (messages: readonly unknown[]): readonly unknown[] => {
  return messages
    .filter((message) => typeof message === 'object' && message !== null && (message as Record<string, unknown>).role !== 'system')
    .map((message) => normalizeValue(message))
}

const getCopilotCorePayload = (requestBody: unknown, includeAssistantTurns: boolean): unknown => {
  if (!requestBody || typeof requestBody !== 'object') {
    return normalizeValue(requestBody)
  }

  const requestBodyObject = requestBody as Record<string, unknown>

  if (Array.isArray(requestBodyObject.messages)) {
    const assistantTurns = requestBodyObject.messages.filter(
      (message) => typeof message === 'object' && message !== null && (message as Record<string, unknown>).role === 'assistant',
    ).length
    const hasToolContext = requestBodyObject.messages.some((message) => {
      if (typeof message !== 'object' || message === null) {
        return false
      }
      const messageRecord = message as Record<string, unknown>
      if ('tool_calls' in messageRecord || 'tool_call_id' in messageRecord) {
        return true
      }
      if (messageRecord.role === 'tool' || messageRecord.role === 'function') {
        return true
      }
      return false
    })
    const normalizedPayload: Record<string, unknown> = {
      messages: normalizeMessages(requestBodyObject.messages),
    }
    if (includeAssistantTurns) {
      normalizedPayload.assistantTurns = assistantTurns
    } else {
      normalizedPayload.messageCount = requestBodyObject.messages.length
      normalizedPayload.assistantTurns = assistantTurns
      if (hasToolContext) {
        normalizedPayload.hasToolContext = true
      }
    }
    return normalizedPayload
  }

  if ('input' in requestBodyObject) {
    return {
      input: normalizeValue(requestBodyObject.input),
    }
  }

  if ('prompt' in requestBodyObject) {
    return {
      prompt: normalizeValue(requestBodyObject.prompt),
    }
  }

  return normalizeValue(requestBody)
}

const getRequestMockKeyInternal = (
  hostname: string,
  pathname: string,
  method: string,
  requestBody: unknown,
  includeAssistantTurns: boolean,
): string | undefined => {
  if (!isCopilotRequest(hostname, pathname, method) || requestBody === undefined) {
    return undefined
  }

  const corePayload = getCopilotCorePayload(requestBody, includeAssistantTurns)
  const normalizedPayload = JSON.stringify(corePayload)
  if (!normalizedPayload || normalizedPayload === '{}' || normalizedPayload === '[]') {
    return undefined
  }

  return createHash('sha256').update(normalizedPayload).digest('hex').slice(0, 16)
}

export const getRequestMockKey = (hostname: string, pathname: string, method: string, requestBody?: unknown): string | undefined => {
  return getRequestMockKeyInternal(hostname, pathname, method, requestBody, true)
}

export const getRelaxedRequestMockKey = (hostname: string, pathname: string, method: string, requestBody?: unknown): string | undefined => {
  return getRequestMockKeyInternal(hostname, pathname, method, requestBody, false)
}

export const appendRequestMockKey = (fileName: string, requestMockKey: string | undefined): string => {
  if (!requestMockKey) {
    return fileName
  }

  if (fileName.endsWith('.json')) {
    return `${fileName.slice(0, -5)}_${requestMockKey}.json`
  }

  return `${fileName}_${requestMockKey}`
}

export const getRequestIdentityKey = (method: string, url: string, requestBody?: unknown): string => {
  try {
    const parsedUrl = new URL(url)
    const requestMockKey = getRequestMockKey(parsedUrl.hostname, parsedUrl.pathname, method, requestBody)
    return requestMockKey ? `${method}:${url}:${requestMockKey}` : `${method}:${url}`
  } catch {
    return `${method}:${url}`
  }
}
