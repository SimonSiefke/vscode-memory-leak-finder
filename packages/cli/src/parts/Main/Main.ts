import * as os from 'node:os'
import * as Cli from '../Cli/Cli.ts'

export const main = async (): Promise<void> => {
  const argv: string[] = process.argv.slice(2)
  const { env } = process
  const { platform } = process
  const arch = os.arch()
  await Cli.run(platform, arch, argv, env)
}
