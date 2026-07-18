import { runCli } from './Cli.ts'

try {
  const resultPath = await runCli(process.argv.slice(2))
  if (resultPath) {
    console.log(`Performance lab result: ${resultPath}`)
  }
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
