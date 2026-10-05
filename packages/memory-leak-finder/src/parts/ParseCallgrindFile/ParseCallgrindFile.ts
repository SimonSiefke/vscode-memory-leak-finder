export interface ParsedCallgrindFile {
  readonly events: readonly string[]
  readonly instructionReferences: number
}

const parseNumber = (value: string): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }
  return parsed
}

export const parseCallgrindFile = (content: string): ParsedCallgrindFile | undefined => {
  const lines = content.split('\n')
  const eventsLine = lines.find((line) => line.startsWith('events:'))
  const summaryLine = lines.find((line) => line.startsWith('summary:'))
  if (!eventsLine || !summaryLine) {
    return undefined
  }
  const events = eventsLine.slice('events:'.length).trim().split(/\s+/).filter(Boolean)
  const summary = summaryLine.slice('summary:'.length).trim().split(/\s+/).filter(Boolean)
  const instructionIndex = events.indexOf('Ir')
  if (instructionIndex === -1 || instructionIndex >= summary.length) {
    return undefined
  }
  const instructionReferences = parseNumber(summary[instructionIndex])
  return {
    events,
    instructionReferences,
  }
}
