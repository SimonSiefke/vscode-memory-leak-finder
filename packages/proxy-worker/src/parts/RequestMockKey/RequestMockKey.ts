import { createHash } from 'node:crypto'
import * as PathPlaceholders from '../PathPlaceholders/PathPlaceholders.ts'

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
const JSON_META_FIELD_REGEX = /"(description|explanation|goal|reason)"\s*:\s*"(?:[^"\\]|\\.)*"/gi
const JSON_TIMEOUT_FIELD_REGEX = /"timeout"\s*:\s*\d+/gi
const DURATION_MS_FIELD_REGEX = /\bduration_ms\s+\d+(?:\.\d+)?\b/gi
const MILLIS_DURATION_REGEX = /\b\d+(?:\.\d+)?ms\b/gi
const SECONDS_DURATION_REGEX = /\b\d+(?:\.\d+)?\s*s\b/gi
const SHELL_PROMPT_DIRTY_BRANCH_REGEX = /\(([^()\n]+?) \*\)/g
const MULTI_WHITESPACE_REGEX = /\s+/g
const COPILOT_EPHEMERAL_KEYS = new Set(['call_id', 'copilot_cache_control', 'encrypted_content', 'id', 'summary', 'tool_call_id'])
const TOOL_CALL_EPHEMERAL_ARGUMENT_KEYS = new Set(['description', 'explanation', 'goal', 'reason', 'timeout'])
const CHAT_SESSION_RESOURCE_PATH_SEGMENTS = ['/GitHub.copilot-chat/chat-session-resources/', '/GitHub.copilot-chat/debug-logs/']

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

const stripToolCallEphemeralArgumentKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stripToolCallEphemeralArgumentKeys)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const normalizedObject: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    if (TOOL_CALL_EPHEMERAL_ARGUMENT_KEYS.has(key)) {
      continue
    }
    normalizedObject[key] = stripToolCallEphemeralArgumentKeys((value as Record<string, unknown>)[key])
  }
  return normalizedObject
}

const getJsonObjectEnd = (value: string, startIndex: number): number => {
  let depth = 0
  let inString = false
  let escaped = false

  for (let index = startIndex; index < value.length; index++) {
    const character = value[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
      continue
    }
    if (character === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }
    if (character === '{') {
      depth++
      continue
    }
    if (character === '}') {
      depth--
      if (depth === 0) {
        return index
      }
    }
  }

  return -1
}

const normalizeEmbeddedArgumentsJson = (value: string): string => {
  const marker = 'Arguments (JSON):'
  let result = ''
  let searchStart = 0

  while (searchStart < value.length) {
    const markerIndex = value.indexOf(marker, searchStart)
    if (markerIndex === -1) {
      result += value.slice(searchStart)
      break
    }

    result += value.slice(searchStart, markerIndex + marker.length)
    let jsonStart = markerIndex + marker.length
    while (jsonStart < value.length && /\s/.test(value[jsonStart])) {
      result += value[jsonStart]
      jsonStart++
    }

    if (value[jsonStart] !== '{') {
      searchStart = jsonStart
      continue
    }

    const jsonEnd = getJsonObjectEnd(value, jsonStart)
    if (jsonEnd === -1) {
      result += value.slice(jsonStart)
      break
    }

    const jsonText = value.slice(jsonStart, jsonEnd + 1)
    try {
      const parsedValue = JSON.parse(jsonText)
      const normalizedJson = JSON.stringify(stripToolCallEphemeralArgumentKeys(parsedValue))
      result += normalizedJson
    } catch {
      result += jsonText
    }

    searchStart = jsonEnd + 1
  }

  return result
}

const normalizeText = (value: string, role?: string): string => {
  const placeholderNormalizedValue = PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInText(value)
  const userRequests = extractUserRequests(placeholderNormalizedValue)
  const relevantText = userRequests.length > 0 ? userRequests.join('\n') : stripTaggedBlocks(placeholderNormalizedValue)
  const textWithNormalizedArguments = normalizeEmbeddedArgumentsJson(relevantText)
  let normalizedValue = textWithNormalizedArguments
    .replace(ISO_DATE_REGEX, '<date>')
    .replace(MONTH_DATE_REGEX, '<date>')
    .replace(UUID_REGEX, '<uuid>')
    .replace(LONG_HEX_REGEX, '<hex>')
    .replace(TIMESTAMP_REGEX, '<timestamp>')
    .replace(SESSION_CALL_ID_REGEX, '<session-call-id>')
    .replace(LOCALHOST_URL_WITH_PORT_REGEX, 'http://localhost:<port>')
    .replace(JSON_META_FIELD_REGEX, (_match, key: string) => `"${key}":"<meta>"`)
    .replace(JSON_TIMEOUT_FIELD_REGEX, '"timeout":<number>')

  if (role === 'tool') {
    normalizedValue = normalizedValue
      .replace(DURATION_MS_FIELD_REGEX, 'duration_ms <duration>')
      .replace(MILLIS_DURATION_REGEX, '<duration-ms>')
      .replace(SECONDS_DURATION_REGEX, '<duration-s>')
      .replace(SHELL_PROMPT_DIRTY_BRANCH_REGEX, '($1)')
  }

  return normalizedValue.replace(MULTI_WHITESPACE_REGEX, ' ').trim()
}

const normalizeValue = (value: unknown, role?: string): unknown => {
  if (typeof value === 'string') {
    return normalizeText(value, role)
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, role))
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
    const normalizedEntry = normalizeValue(objectValue[key], role)
    if (normalizedEntry !== undefined) {
      normalizedObject[key] = normalizedEntry
    }
  }
  return normalizedObject
}

const normalizeToolCallArguments = (toolName: unknown, argumentsValue: unknown): Record<string, unknown> => {
  if (typeof argumentsValue !== 'string') {
    return {
      arguments: normalizeValue(argumentsValue, 'assistant'),
      name: toolName,
    }
  }

  try {
    const parsedArguments = JSON.parse(argumentsValue) as Record<string, unknown>
    const normalizedArguments: Record<string, unknown> = {}
    const filePath = typeof parsedArguments.filePath === 'string' ? parsedArguments.filePath : undefined
    const isEphemeralChatSessionRead =
      toolName === 'read_file' &&
      filePath !== undefined &&
      CHAT_SESSION_RESOURCE_PATH_SEGMENTS.some((segment) => filePath.includes(segment))

    for (const key of Object.keys(parsedArguments).sort()) {
      if (TOOL_CALL_EPHEMERAL_ARGUMENT_KEYS.has(key)) {
        continue
      }
      if (isEphemeralChatSessionRead && (key === 'startLine' || key === 'endLine')) {
        continue
      }
      const normalizedEntry = normalizeValue(parsedArguments[key], 'assistant')
      if (normalizedEntry !== undefined && normalizedEntry !== '') {
        normalizedArguments[key] = normalizedEntry
      }
    }
    return {
      arguments: normalizedArguments,
      name: toolName,
    }
  } catch {
    return {
      arguments: normalizeText(argumentsValue, 'assistant'),
      name: toolName,
    }
  }
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
    if (key === 'tool_calls' && Array.isArray(message[key])) {
      normalizedMessage.tool_calls = message[key].map((toolCall) => {
        if (!toolCall || typeof toolCall !== 'object') {
          return normalizeValue(toolCall, 'assistant')
        }

        const toolCallRecord = toolCall as Record<string, unknown>
        const functionRecord =
          toolCallRecord.function && typeof toolCallRecord.function === 'object'
            ? (toolCallRecord.function as Record<string, unknown>)
            : undefined

        return {
          function: normalizeToolCallArguments(functionRecord?.name, functionRecord?.arguments),
          type: toolCallRecord.type,
        }
      })
      continue
    }
    const normalizedEntry = normalizeValue(message[key], typeof role === 'string' ? role : undefined)
    if (normalizedEntry !== undefined && normalizedEntry !== '') {
      normalizedMessage[key] = normalizedEntry
    }
  }
  return normalizedMessage
}

const normalizeResponsesInputItem = (item: unknown): unknown => {
  if (!item || typeof item !== 'object') {
    return normalizeValue(item)
  }

  const itemRecord = item as Record<string, unknown>
  if (itemRecord.role === 'system') {
    return undefined
  }

  if (itemRecord.type === 'function_call_output') {
    const normalizedItem: Record<string, unknown> = {}
    for (const key of Object.keys(itemRecord).sort()) {
      if (COPILOT_EPHEMERAL_KEYS.has(key)) {
        continue
      }
      const normalizedEntry = key === 'output' ? normalizeValue(itemRecord[key], 'tool') : normalizeValue(itemRecord[key])
      if (normalizedEntry !== undefined && normalizedEntry !== '') {
        normalizedItem[key] = normalizedEntry
      }
    }
    return normalizedItem
  }

  return normalizeValue(item)
}

const normalizeResponsesInput = (input: readonly unknown[]): readonly unknown[] => {
  return input.map((item) => normalizeResponsesInputItem(item)).filter((item) => item !== undefined)
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
      input: Array.isArray(requestBodyObject.input)
        ? normalizeResponsesInput(requestBodyObject.input)
        : normalizeValue(requestBodyObject.input),
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

const collectUserRequests = (value: unknown): readonly string[] => {
  if (typeof value === 'string') {
    const placeholderNormalizedValue = PathPlaceholders.replaceAbsolutePathsWithPlaceholdersInText(value)
    return extractUserRequests(placeholderNormalizedValue).map((request) => normalizeText(request))
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectUserRequests(item))
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  return Object.values(value as Record<string, unknown>).flatMap((item) => collectUserRequests(item))
}

export const getRequestMockKey = (hostname: string, pathname: string, method: string, requestBody?: unknown): string | undefined => {
  return getRequestMockKeyInternal(hostname, pathname, method, requestBody, true)
}

export const getRelaxedRequestMockKey = (hostname: string, pathname: string, method: string, requestBody?: unknown): string | undefined => {
  return getRequestMockKeyInternal(hostname, pathname, method, requestBody, false)
}

export const getUserRequestMockKey = (hostname: string, pathname: string, method: string, requestBody?: unknown): string | undefined => {
  if (!isCopilotRequest(hostname, pathname, method) || requestBody === undefined) {
    return undefined
  }

  const userRequests = collectUserRequests(requestBody)
  if (userRequests.length === 0) {
    return undefined
  }

  return createHash('sha256').update(JSON.stringify(userRequests)).digest('hex').slice(0, 16)
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
