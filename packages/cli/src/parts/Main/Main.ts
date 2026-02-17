import * as Cli from '../Cli/Cli.ts'

export const main = async (): Promise<void> => {
  const { arch, argv, env, platform, versions } = process

  const nodeVersion = versions.node
  if (nodeVersion) {
    const majorVersion = Number.parseInt(nodeVersion.split('.')[0] || '0', 10)
    if (majorVersion < 24) {
      console.error('Error: Node.js 24 or later is required')
      process.exitCode = 1
      return
    }
  }
  const relevantArgv: string[] = argv.slice(2)
  await Cli.run(platform, arch, relevantArgv, env)
}
