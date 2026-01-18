import * as Listen from '../Listen/Listen.ts'

export const main = async (): Promise<void> => {
  await Listen.listen()
}
