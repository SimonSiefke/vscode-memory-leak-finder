import { string } from '@lvce-editor/assert'

export const write = async (data: string): Promise<void> => {
  string(data)
  process.stdout.write(data)
}
