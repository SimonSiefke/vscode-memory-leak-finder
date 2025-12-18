import type { ParsedVersion } from '../ParsedVersion/ParsedVersion.ts'

export const parseVersion = (version: string): ParsedVersion => {
  const parts = version.split('.')
  return {
    major: Number.parseInt(parts[0]),
    minor: Number.parseInt(parts[1]),
    patch: Number.parseInt(parts[2]),
  }
}
