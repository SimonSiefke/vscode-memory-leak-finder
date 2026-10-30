import { resolve } from 'node:path'

export const parseOptions = (argv: string[]) => {
  const get = (name: string, fallback = ''): string => {
    const index = argv.indexOf(name)
    if (index < 0) return fallback
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value`)
    return value
  }
  const required = (name: string): string => {
    const value = get(name)
    if (!value) throw new Error(`${name} is required`)
    return value
  }
  const samples = Number(get('--samples', '37'))
  if (!Number.isSafeInteger(samples) || samples < 1 || samples > 1000) throw new Error('--samples must be an integer between 1 and 1000')
  return { get, required, samples, output: resolve(get('--output-dir', '.large-performance')) }
}
