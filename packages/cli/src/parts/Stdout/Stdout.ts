import { string } from '@lvce-editor/assert'

let colorEnabled = true

export const setColorEnabled = (enabled: boolean): void => {
  colorEnabled = enabled
}

export const write = async (data: string): Promise<void> => {
  string(data)
  // Chalk styles use SGR sequences. Preserve other ANSI controls such as the
  // cursor movement and clearing sequences used by watch mode.
  const output = colorEnabled ? data : data.replace(/\u001B\[[\d;]*m/g, '')
  process.stdout.write(output)
}
