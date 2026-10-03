import { execFile } from 'node:child_process'

export const execFilePromise = async (command: string, args: readonly string[]): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    execFile(command, [...args], (error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}
