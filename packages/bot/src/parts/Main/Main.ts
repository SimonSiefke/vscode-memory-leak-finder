import { run, type ApplicationFunction } from 'probot'
import { app } from '../App/App.ts'

const getServerEnv = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv => {
  if (env.HOST || env.NODE_ENV !== 'production') {
    return env
  }
  return {
    ...env,
    HOST: '0.0.0.0',
  }
}

export const main = async (
  runApp: (appFnOrArgv: ApplicationFunction | string[], additionalOptions?: { env?: NodeJS.ProcessEnv }) => Promise<unknown> = run,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> => {
  await runApp(app, { env: getServerEnv(env) })
}
