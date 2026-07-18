import type { Goal, MetricName } from './Types.ts'

const metricAliases: Readonly<Record<string, MetricName>> = {
  'action-to-ready': 'latencyMs',
  cycles: 'cycles',
  instructions: 'instructions',
  latency: 'latencyMs',
  latencyms: 'latencyMs',
}

export const parseGoal = (value = 'latency:-5%'): Goal => {
  const match = /^([a-z-]+):(-?\d+(?:\.\d+)?)%$/i.exec(value.trim())
  if (!match) {
    throw new Error(`Invalid goal "${value}". Expected a value such as latency:-50% or instructions:-20%`)
  }
  const metric = metricAliases[match[1].toLowerCase()]
  if (!metric) {
    throw new Error(`Unsupported goal metric "${match[1]}"`)
  }
  const targetRelativeChange = Number(match[2]) / 100
  if (!Number.isFinite(targetRelativeChange) || targetRelativeChange >= 0 || targetRelativeChange <= -1) {
    throw new Error(`Goal must request a reduction greater than 0% and less than 100%`)
  }
  return {
    metric,
    targetRelativeChange,
  }
}
