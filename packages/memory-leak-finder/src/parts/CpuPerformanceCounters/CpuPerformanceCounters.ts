export interface CpuPerformanceCounter {
  readonly available: boolean
  readonly event: string
  readonly name: string
  readonly unit: string
  readonly value: number | null
}

export interface CpuPerformanceCountersSample {
  readonly command: readonly string[]
  readonly cycles: number | null
  readonly instructions: number | null
  readonly perfPid?: number
  readonly pid: number
  readonly rawOutput: string
}

const counterSpecs = [
  {
    event: 'instructions:u',
    name: 'instructions',
    unit: 'count',
  },
  {
    event: 'cycles:u',
    name: 'cycles',
    unit: 'count',
  },
] as const

const parseCounterValue = (value: string): number | null => {
  const normalized = value.trim()
  if (!normalized || normalized.startsWith('<')) {
    return null
  }
  const parsed = Number(normalized.replaceAll(',', ''))
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

const normalizeEventName = (eventName: string): string => {
  return eventName.trim().split(':')[0]
}

export const parsePerfStatOutput = (rawOutput: string): Pick<CpuPerformanceCountersSample, 'cycles' | 'instructions'> => {
  const counters: Record<string, number | null> = Object.create(null)
  const lines = rawOutput.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const csvParts = trimmed.split(',')
    if (csvParts.length >= 3 && csvParts[1] === '' && csvParts[2]) {
      counters[normalizeEventName(csvParts[2])] = parseCounterValue(csvParts[0])
      continue
    }
    const textMatch = /^\s*([0-9,]+|<[^>]+>)\s+([A-Za-z][\w:-]*)/.exec(line)
    if (textMatch) {
      counters[normalizeEventName(textMatch[2])] = parseCounterValue(textMatch[1])
    }
  }
  return {
    cycles: counters.cycles ?? null,
    instructions: counters.instructions ?? null,
  }
}

export const toCpuPerformanceCounterRows = (sample: CpuPerformanceCountersSample): readonly CpuPerformanceCounter[] => {
  return counterSpecs.map((spec) => {
    const value = sample[spec.name]
    return {
      available: typeof value === 'number',
      event: spec.event,
      name: spec.name,
      unit: spec.unit,
      value,
    }
  })
}

export const formatCpuPerformanceCountersSummary = (metrics: readonly CpuPerformanceCounter[]): string => {
  const availableMetrics = metrics.filter((metric) => metric.available)
  if (availableMetrics.length === 0) {
    return 'No CPU performance counters were available'
  }
  const lines = ['CPU performance counters:', 'metric | value | unit']
  for (const metric of availableMetrics) {
    lines.push(`${metric.name} | ${metric.value} | ${metric.unit}`)
  }
  return lines.join('\n')
}
