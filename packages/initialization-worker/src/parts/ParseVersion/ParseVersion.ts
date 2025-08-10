import type { ParsedVersion } from '../ParsedVersion/ParsedVersion.ts'

export const parseVersion = (version: string): ParsedVersion => {
  const parts = version.split('.')
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
    patch: parseInt(parts[2]),
  }
}
