import { readFile, rename, writeFile } from 'node:fs/promises'
import * as Measurement from '../Measurement/Measurement.ts'

interface WorkerConfig {
  readonly perfOutputPath?: string
  readonly pid: number
  readonly readyPath: string
  readonly resultPath: string
  readonly window: 'fromStart' | 'scenario'
}

const writeJson = async (path: string, value: unknown): Promise<void> => {
  const temporaryPath = `${path}.${process.pid}.tmp`
  await writeFile(temporaryPath, JSON.stringify(value))
  await rename(temporaryPath, path)
}

const readConfig = async (): Promise<WorkerConfig> => {
  const configPath = process.argv[2]
  if (!configPath) {
    throw new Error('Linux process-tree worker requires a configuration path')
  }
  return JSON.parse(await readFile(configPath, 'utf8'))
}

export const main = async (): Promise<void> => {
  const config = await readConfig()
  const stop = Promise.withResolvers<void>()
  const handleStop = (): void => stop.resolve()
  process.once('SIGINT', handleStop)
  process.once('SIGTERM', handleStop)
  let measurement: Measurement.Measurement | undefined
  try {
    measurement = await Measurement.start(config)
    await writeJson(config.readyPath, { ready: true })
    await stop.promise
    const result = await measurement.stop()
    await writeJson(config.resultPath, { result })
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`
    await Promise.all([writeJson(config.readyPath, { error: message }), writeJson(config.resultPath, { error: message })])
    process.exitCode = 1
  } finally {
    process.off('SIGINT', handleStop)
    process.off('SIGTERM', handleStop)
    await measurement?.dispose()
  }
}
