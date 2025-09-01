import * as Path from '../Path/Path.ts'

export interface TscErrorLocation {
  readonly file: string
  readonly line: number
}

const regexes: readonly RegExp[] = [
  // file.ts:10:5 - error TSxxxx: message
  /^(?<file>[^:(\n]+):(\s?)(?<line>\d+):(\d+)\s+-\s+error\s+TS\d+:\s+/,
  // path/file.ts(10,5): error TSxxxx: message
  /^(?<file>[^:(\n]+)\((?<line>\d+),(\d+)\):\s+error\s+TS\d+:\s+/, 
]

export const parseTscErrors = (output: string, baseDir: string): readonly TscErrorLocation[] => {
  const locations: TscErrorLocation[] = []
  const seen = new Set<string>()
  const lines = output.split('\n')
  for (const line of lines) {
    let matched = false
    for (const regex of regexes) {
      const match = line.match(regex)
      if (match && match.groups) {
        const rawFile = match.groups.file as string
        const lineNumber = Number(match.groups.line)
        const absFile = rawFile.startsWith('/') ? rawFile : Path.join(baseDir, rawFile)
        const key = `${absFile}:${lineNumber}`
        if (!seen.has(key)) {
          seen.add(key)
          locations.push({ file: absFile, line: lineNumber })
        }
        matched = true
        break
      }
    }
    if (matched) {
      continue
    }
  }
  return locations
}


