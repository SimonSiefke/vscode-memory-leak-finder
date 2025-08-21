import * as Cli from '../Cli/Cli.ts'

export const main = async (): Promise<void> => {
  const argv: string[] = process.argv.slice(2)
  const env = process.env
  await Cli.run(process.platform, argv, env)
}
