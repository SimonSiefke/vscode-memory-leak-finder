import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

type Dynamic = unknown

export type IpcMessage = {
  readonly args?: readonly Dynamic[]
  readonly channel?: string
  readonly result?: Dynamic
  readonly timestamp?: number
  readonly type?: string
}

export type CategoryId =
  | 'extension-manifests'
  | 'nls-data'
  | 'storage-data'
  | 'file-content'
  | 'theme-and-icon-data'
  | 'file-metadata'
  | 'policy-data'
  | 'startup-config'
  | 'keyboard-data'
  | 'other'

export type MessageSummary = {
  readonly index: number
  readonly bytes: number
  readonly type: string
  readonly channel: string
  readonly command: string
  readonly sample: string
}

export type CategorySummary = {
  readonly id: CategoryId
  readonly label: string
  readonly bytes: number
  readonly count: number
  readonly percentage: number
  readonly topMessages: readonly MessageSummary[]
}

export type DuplicateSummary = {
  readonly hash: string
  readonly count: number
  readonly bytes: number
  readonly firstIndex: number
  readonly type: string
  readonly channel: string
  readonly command: string
  readonly sample: string
}

export type AnalysisSummary = {
  readonly inputPath: string
  readonly totalMessages: number
  readonly totalBytes: number
  readonly categories: readonly CategorySummary[]
  readonly largestMessages: readonly MessageSummary[]
  readonly duplicatePayloads: readonly DuplicateSummary[]
}

export type AnalyzeOptions = {
  readonly inputPath: string
  readonly top?: number
}

export type CliOptions = {
  readonly inputPath: string
  readonly jsonPath: string
  readonly svgPath: string
  readonly top: number
  readonly writeSvg: boolean
}

const categoryLabels: Record<CategoryId, string> = {
  'extension-manifests': 'Extension manifests',
  'nls-data': 'NLS data',
  'storage-data': 'Storage data',
  'file-content': 'File content',
  'theme-and-icon-data': 'Theme and icon data',
  'file-metadata': 'File metadata',
  'policy-data': 'Policy data',
  'startup-config': 'Startup config',
  'keyboard-data': 'Keyboard data',
  other: 'Other',
}

const categoryOrder: readonly CategoryId[] = [
  'extension-manifests',
  'nls-data',
  'storage-data',
  'file-content',
  'theme-and-icon-data',
  'file-metadata',
  'policy-data',
  'startup-config',
  'keyboard-data',
  'other',
]

const categoryColors: Record<CategoryId, string> = {
  'extension-manifests': '#3366cc',
  'nls-data': '#dc3912',
  'storage-data': '#ff9900',
  'file-content': '#109618',
  'theme-and-icon-data': '#990099',
  'file-metadata': '#0099c6',
  'policy-data': '#dd4477',
  'startup-config': '#66aa00',
  'keyboard-data': '#b82e2e',
  other: '#777777',
}

const defaultInputPath = '.vscode-memory-leak-finder-results/node/ipcMessagesFromStart/editor-open-text-file.json'
const defaultTop = 10

const root = join(import.meta.dirname, '../../..')

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim()
}

const truncate = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength - 1)}…`
}

const getMessagePayload = (message: IpcMessage): Dynamic => {
  if (message.args !== undefined) {
    return message.args
  }
  if (message.result !== undefined) {
    return message.result
  }
  return message
}

const stringify = (value: Dynamic): string => {
  return JSON.stringify(value) ?? ''
}

const getCommand = (message: IpcMessage): string => {
  const firstArg = message.args?.[0]
  if (Array.isArray(firstArg) && typeof firstArg[0] === 'number' && typeof firstArg[1] === 'number') {
    return `${firstArg[0]}:${firstArg[1]}`
  }
  return ''
}

const createMessageSummary = (message: IpcMessage, index: number, serialized: string, bytes: number): MessageSummary => {
  return {
    index,
    bytes,
    type: message.type || '',
    channel: message.channel || '',
    command: getCommand(message),
    sample: truncate(normalizeWhitespace(serialized), 280),
  }
}

const hasExtensionManifestShape = (serialized: string): boolean => {
  return (
    serialized.includes('"manifest"') ||
    serialized.includes('"activationEvents"') ||
    serialized.includes('"contributes"') ||
    (serialized.includes('"name"') && serialized.includes('"publisher"') && serialized.includes('"engines"')) ||
    /"location":\{[^}]*"fsPath":"[^"]*\/extensions"/.test(serialized)
  )
}

const hasNlsShape = (serialized: string): boolean => {
  return (
    serialized.includes('%displayName%') ||
    serialized.includes('%description%') ||
    serialized.includes('"translations"') ||
    serialized.includes('"command.') ||
    serialized.includes('.command.') ||
    serialized.includes('"configuration.') ||
    serialized.includes('.configuration.') ||
    (serialized.includes('"displayName"') && serialized.includes('"description"') && !hasExtensionManifestShape(serialized))
  )
}

const hasStorageShape = (serialized: string): boolean => {
  return (
    serialized.includes('"storage"') ||
    serialized.includes('"updateItems"') ||
    serialized.includes('"__$__targetStorageMarker"') ||
    serialized.includes('"telemetry.currentSessionDate"') ||
    serialized.includes('"memento/') ||
    serialized.includes('"workbench.activity.') ||
    serialized.includes('"workbench.panel.')
  )
}

const hasFileContentShape = (serialized: string): boolean => {
  return (
    serialized.includes('"type":"Buffer"') ||
    serialized.includes('"type":"buffer"') ||
    serialized.includes('"type":"uint8array"') ||
    serialized.includes('"readFileStream"') ||
    (serialized.includes('"readFile"') && serialized.includes('"data":['))
  )
}

const hasThemeAndIconShape = (serialized: string): boolean => {
  return (
    serialized.includes('"$schema":"vscode://schemas/color-theme"') ||
    serialized.includes('"iconDefinitions"') ||
    serialized.includes('"fileExtensions"') ||
    serialized.includes('"fileNames"') ||
    (serialized.includes('"fonts"') && serialized.includes('"fontCharacter"')) ||
    serialized.includes('"productIconTheme"') ||
    serialized.includes('"colorThemeData"') ||
    serialized.includes('"iconThemeData"')
  )
}

const hasFileMetadataShape = (serialized: string): boolean => {
  const hasUri = serialized.includes('"fsPath"') || serialized.includes('"external":"file://') || serialized.includes('"scheme":"file"')
  const hasStatLikeData =
    serialized.includes('"mtime"') ||
    serialized.includes('"ctime"') ||
    serialized.includes('"etag"') ||
    serialized.includes('"size"') ||
    serialized.includes('"isDirectory"') ||
    serialized.includes('"children"')
  return hasUri && hasStatLikeData
}

const hasPolicyShape = (serialized: string): boolean => {
  return (
    serialized.includes('"policy"') || serialized.includes('"nativeManagedSettings"') || serialized.includes('"updatePolicyDefinitions"')
  )
}

const hasStartupConfigShape = (message: IpcMessage, serialized: string): boolean => {
  return (
    message.type === 'handle-response' &&
    serialized.includes('"appRoot"') &&
    serialized.includes('"execPath"') &&
    serialized.includes('"user-data-dir"')
  )
}

const hasKeyboardShape = (serialized: string): boolean => {
  return serialized.includes('"keyboardMapping"') || serialized.includes('"KeyboardLayout"')
}

export const categorizeMessage = (message: IpcMessage, serialized: string): CategoryId => {
  if (hasExtensionManifestShape(serialized)) {
    return 'extension-manifests'
  }
  if (hasStartupConfigShape(message, serialized)) {
    return 'startup-config'
  }
  if (hasNlsShape(serialized)) {
    return 'nls-data'
  }
  if (hasStorageShape(serialized)) {
    return 'storage-data'
  }
  if (hasFileContentShape(serialized)) {
    return 'file-content'
  }
  if (hasThemeAndIconShape(serialized)) {
    return 'theme-and-icon-data'
  }
  if (hasFileMetadataShape(serialized)) {
    return 'file-metadata'
  }
  if (hasPolicyShape(serialized)) {
    return 'policy-data'
  }
  if (hasKeyboardShape(serialized)) {
    return 'keyboard-data'
  }
  return 'other'
}

const sortMessageSummaries = (messages: readonly MessageSummary[]): readonly MessageSummary[] => {
  return [...messages].sort((a, b) => b.bytes - a.bytes || a.index - b.index)
}

const getPercentage = (bytes: number, totalBytes: number): number => {
  if (totalBytes === 0) {
    return 0
  }
  return Number(((bytes / totalBytes) * 100).toFixed(2))
}

const createInitialCategoryMap = (): Map<CategoryId, { bytes: number; count: number; topMessages: MessageSummary[] }> => {
  const categories = new Map<CategoryId, { bytes: number; count: number; topMessages: MessageSummary[] }>()
  for (const category of categoryOrder) {
    categories.set(category, {
      bytes: 0,
      count: 0,
      topMessages: [],
    })
  }
  return categories
}

const addTopMessage = (messages: MessageSummary[], message: MessageSummary, top: number): void => {
  messages.push(message)
  messages.sort((a, b) => b.bytes - a.bytes || a.index - b.index)
  if (messages.length > top) {
    messages.pop()
  }
}

const getPayloadHash = (message: IpcMessage): { hash: string; payloadSerialized: string } => {
  const payloadSerialized = stringify({
    channel: message.channel,
    type: message.type,
    payload: getMessagePayload(message),
  })
  return {
    hash: createHash('sha256').update(payloadSerialized).digest('hex'),
    payloadSerialized,
  }
}

const getDuplicateSummaries = (
  duplicates: Map<string, { count: number; bytes: number; firstMessage: MessageSummary }>,
  top: number,
): readonly DuplicateSummary[] => {
  return [...duplicates.entries()]
    .filter(([, value]) => value.count > 1)
    .map(([hash, value]) => ({
      hash,
      count: value.count,
      bytes: value.bytes,
      firstIndex: value.firstMessage.index,
      type: value.firstMessage.type,
      channel: value.firstMessage.channel,
      command: value.firstMessage.command,
      sample: value.firstMessage.sample,
    }))
    .sort((a, b) => b.bytes - a.bytes || b.count - a.count || a.firstIndex - b.firstIndex)
    .slice(0, top)
}

export const extractMessages = (parsed: Dynamic): readonly IpcMessage[] => {
  if (Array.isArray(parsed)) {
    return parsed as readonly IpcMessage[]
  }
  if (typeof parsed === 'object' && parsed && 'ipcMessagesFromStart' in parsed) {
    const maybeMessages = (parsed as { readonly ipcMessagesFromStart?: Dynamic }).ipcMessagesFromStart
    if (Array.isArray(maybeMessages)) {
      return maybeMessages as readonly IpcMessage[]
    }
  }
  throw new Error('Expected an array or an object with ipcMessagesFromStart array')
}

export const analyzeMessages = (messages: readonly IpcMessage[], inputPath: string, top = defaultTop): AnalysisSummary => {
  const categoryMap = createInitialCategoryMap()
  const largestMessages: MessageSummary[] = []
  const duplicateMap = new Map<string, { count: number; bytes: number; firstMessage: MessageSummary }>()
  let totalBytes = 0

  for (const [index, message] of messages.entries()) {
    const serialized = stringify(message)
    const bytes = Buffer.byteLength(serialized)
    const messageSummary = createMessageSummary(message, index, serialized, bytes)
    const category = categorizeMessage(message, serialized)
    const categorySummary = categoryMap.get(category)
    if (!categorySummary) {
      throw new Error(`Unknown category: ${category}`)
    }
    categorySummary.bytes += bytes
    categorySummary.count++
    addTopMessage(categorySummary.topMessages, messageSummary, top)
    addTopMessage(largestMessages, messageSummary, top)
    totalBytes += bytes

    const { hash, payloadSerialized } = getPayloadHash(message)
    const duplicate = duplicateMap.get(hash)
    if (duplicate) {
      duplicate.count++
      duplicate.bytes += Buffer.byteLength(payloadSerialized)
    } else {
      duplicateMap.set(hash, {
        count: 1,
        bytes: Buffer.byteLength(payloadSerialized),
        firstMessage: messageSummary,
      })
    }
  }

  const categories = categoryOrder
    .map((id) => {
      const category = categoryMap.get(id)
      if (!category) {
        throw new Error(`Missing category: ${id}`)
      }
      return {
        id,
        label: categoryLabels[id],
        bytes: category.bytes,
        count: category.count,
        percentage: getPercentage(category.bytes, totalBytes),
        topMessages: sortMessageSummaries(category.topMessages),
      }
    })
    .filter((category) => category.count > 0)
    .sort((a, b) => b.bytes - a.bytes || categoryOrder.indexOf(a.id) - categoryOrder.indexOf(b.id))

  return {
    inputPath,
    totalMessages: messages.length,
    totalBytes,
    categories,
    largestMessages: sortMessageSummaries(largestMessages),
    duplicatePayloads: getDuplicateSummaries(duplicateMap, top),
  }
}

export const analyzeIpcMessagesFromStart = async ({ inputPath, top = defaultTop }: AnalyzeOptions): Promise<AnalysisSummary> => {
  const content = await readFile(inputPath, 'utf8')
  const parsed = JSON.parse(content) as Dynamic
  return analyzeMessages(extractMessages(parsed), inputPath, top)
}

export const getDefaultOutputPaths = (inputPath = defaultInputPath): { readonly jsonPath: string; readonly svgPath: string } => {
  const withoutJson = inputPath.replace(/\.json$/i, '')
  return {
    jsonPath: `${withoutJson}.analysis.json`,
    svgPath: `${withoutJson}.analysis.svg`,
  }
}

const readFlagValue = (args: readonly string[], index: number, flag: string): string => {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`)
  }
  return value
}

export const parseCliArgs = (args: readonly string[]): CliOptions => {
  let inputPath = defaultInputPath
  let top = defaultTop
  let writeSvg = true
  let jsonPath = ''
  let svgPath = ''

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--input') {
      inputPath = readFlagValue(args, i, arg)
      i++
    } else if (arg === '--json') {
      jsonPath = readFlagValue(args, i, arg)
      i++
    } else if (arg === '--svg') {
      svgPath = readFlagValue(args, i, arg)
      i++
    } else if (arg === '--top') {
      const value = Number.parseInt(readFlagValue(args, i, arg), 10)
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error('--top must be a positive integer')
      }
      top = value
      i++
    } else if (arg === '--no-svg') {
      writeSvg = false
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  const defaults = getDefaultOutputPaths(inputPath)
  return {
    inputPath,
    jsonPath: jsonPath || defaults.jsonPath,
    svgPath: svgPath || defaults.svgPath,
    top,
    writeSvg,
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex++
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}

const pad = (value: string, width: number): string => {
  return value.padEnd(width, ' ')
}

export const formatConsoleSummary = (summary: AnalysisSummary): string => {
  const lines: string[] = []
  lines.push(`IPC messages: ${summary.totalMessages}`)
  lines.push(`Total bytes: ${formatBytes(summary.totalBytes)} (${summary.totalBytes})`)
  lines.push('')
  lines.push('Categories by bytes:')
  lines.push(`${pad('category', 26)} ${pad('messages', 8)} ${pad('bytes', 12)} percent`)
  for (const category of summary.categories) {
    lines.push(
      `${pad(category.id, 26)} ${pad(String(category.count), 8)} ${pad(formatBytes(category.bytes), 12)} ${category.percentage.toFixed(2)}%`,
    )
  }
  lines.push('')
  lines.push('Largest messages:')
  for (const message of summary.largestMessages) {
    lines.push(`#${message.index} ${formatBytes(message.bytes)} ${message.type} ${message.channel} ${message.command}`.trim())
  }
  lines.push('')
  lines.push('Largest duplicate payloads:')
  if (summary.duplicatePayloads.length === 0) {
    lines.push('(none)')
  } else {
    for (const duplicate of summary.duplicatePayloads) {
      lines.push(
        `${duplicate.count}x ${formatBytes(duplicate.bytes)} first=#${duplicate.firstIndex} ${duplicate.type} ${duplicate.channel} ${duplicate.command}`.trim(),
      )
    }
  }
  return lines.join('\n')
}

const escapeXml = (value: string): string => {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const estimateTextWidth = (value: string, fontSize: number): number => {
  let width = 0
  for (const character of value) {
    if (character === ' ') {
      width += fontSize * 0.28
    } else if ('il.,:;!|'.includes(character)) {
      width += fontSize * 0.3
    } else if ('mwMW'.includes(character)) {
      width += fontSize * 0.88
    } else if (/[A-Z0-9]/.test(character)) {
      width += fontSize * 0.62
    } else {
      width += fontSize * 0.52
    }
  }
  return Math.ceil(width)
}

export const createSvgChart = (summary: AnalysisSummary): string => {
  const categories = summary.categories.filter((category) => category.bytes > 0)
  const legendX = 320
  const legendY = 76
  const legendTextX = legendX + 24
  const legendDetailGap = 12
  const legendRowHeight = 28
  const paddingRight = 36
  const legendRowsData = categories.map((category) => {
    const label = `${category.label} (${category.percentage.toFixed(2)}%)`
    const detail = `${formatBytes(category.bytes)}, ${category.count} messages`
    const detailX = legendTextX + estimateTextWidth(label, 14) + legendDetailGap
    const rowWidth = detailX + estimateTextWidth(detail, 13) + paddingRight
    return {
      category,
      detail,
      detailX,
      label,
      rowWidth,
    }
  })
  const width = Math.max(640, ...legendRowsData.map((row) => row.rowWidth))
  const height = Math.max(360, legendY + categories.length * legendRowHeight + 36)
  const chartCenterX = 142
  const chartCenterY = 172
  const chartRadius = 72
  const circumference = 2 * Math.PI * chartRadius
  let offset = 0
  const circles: string[] = []
  for (const category of categories) {
    const length = summary.totalBytes === 0 ? 0 : (category.bytes / summary.totalBytes) * circumference
    const gap = circumference - length
    circles.push(
      `<circle cx="${chartCenterX}" cy="${chartCenterY}" r="${chartRadius}" fill="none" stroke="${categoryColors[category.id]}" stroke-width="34" stroke-dasharray="${length.toFixed(
        3,
      )} ${gap.toFixed(3)}" stroke-dashoffset="${(-offset).toFixed(3)}" transform="rotate(-90 ${chartCenterX} ${chartCenterY})" />`,
    )
    offset += length
  }

  const legendRows = legendRowsData.map(({ category, detail, detailX, label }, index) => {
    const y = legendY + index * legendRowHeight
    return [
      `<rect x="${legendX}" y="${y - 13}" width="14" height="14" fill="${categoryColors[category.id]}" rx="2" />`,
      `<text x="${legendTextX}" y="${y}" font-size="14" font-family="Arial, sans-serif" fill="#222">${escapeXml(label)}</text>`,
      `<text x="${detailX}" y="${y}" font-size="13" font-family="Arial, sans-serif" fill="#555">${escapeXml(detail)}</text>`,
    ].join('\n')
  })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="IPC startup payload bytes by category">`,
    `<rect width="${width}" height="${height}" fill="#ffffff" />`,
    '<text x="32" y="34" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#111">IPC startup payload bytes</text>',
    '<g>',
    ...circles,
    `<circle cx="${chartCenterX}" cy="${chartCenterY}" r="46" fill="#ffffff" />`,
    `<text x="${chartCenterX}" y="${chartCenterY - 4}" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#111" text-anchor="middle">${escapeXml(
      formatBytes(summary.totalBytes),
    )}</text>`,
    `<text x="${chartCenterX}" y="${chartCenterY + 18}" font-size="12" font-family="Arial, sans-serif" fill="#666" text-anchor="middle">${summary.totalMessages} messages</text>`,
    '</g>',
    '<g>',
    ...legendRows,
    '</g>',
    '</svg>',
    '',
  ].join('\n')
}

const writeTextFile = async (filePath: string, content: string): Promise<void> => {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content)
}

export const runCli = async (args: readonly string[], logger: Pick<Console, 'error' | 'log'> = console): Promise<void> => {
  const options = parseCliArgs(args)
  const inputPath = options.inputPath.startsWith('.') ? join(root, options.inputPath) : options.inputPath
  const jsonPath = options.jsonPath.startsWith('.') ? join(root, options.jsonPath) : options.jsonPath
  const svgPath = options.svgPath.startsWith('.') ? join(root, options.svgPath) : options.svgPath
  const summary = await analyzeIpcMessagesFromStart({ inputPath, top: options.top })
  await writeTextFile(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  if (options.writeSvg) {
    await writeTextFile(svgPath, createSvgChart(summary))
  }
  logger.log(formatConsoleSummary(summary))
  logger.log('')
  logger.log(`Wrote ${jsonPath}`)
  if (options.writeSvg) {
    logger.log(`Wrote ${svgPath}`)
  }
}

const main = async (): Promise<void> => {
  try {
    await runCli(process.argv.slice(2))
  } catch (error) {
    console.error((error as Error).message)
    process.exit(1)
  }
}

const isEntryPoint = process.argv[1] === fileURLToPath(import.meta.url)

if (isEntryPoint) {
  main()
}
