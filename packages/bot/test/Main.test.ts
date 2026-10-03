import { expect, test } from '@jest/globals'
import { app } from '../src/parts/App/App.ts'
import * as Main from '../src/parts/Main/Main.ts'

test('main passes the current environment to probot run', async () => {
  const env = {
    PORT: '4567',
  }
  let actualApp: unknown = undefined
  let actualOptions: unknown = undefined

  const runApp = async (appFnOrArgv: unknown, additionalOptions?: { env?: NodeJS.ProcessEnv }): Promise<void> => {
    actualApp = appFnOrArgv
    actualOptions = additionalOptions
  }

  await Main.main(runApp, env)

  expect(actualApp).toBe(app)
  expect(actualOptions).toEqual({
    env,
  })
})

test('main binds to 0.0.0.0 by default in production', async () => {
  const env = {
    NODE_ENV: 'production',
    PORT: '4567',
  }
  let actualOptions: unknown = undefined

  const runApp = async (_appFnOrArgv: unknown, additionalOptions?: { env?: NodeJS.ProcessEnv }): Promise<void> => {
    actualOptions = additionalOptions
  }

  await Main.main(runApp, env)

  expect(actualOptions).toEqual({
    env: {
      HOST: '0.0.0.0',
      NODE_ENV: 'production',
      PORT: '4567',
    },
  })
})

test('main preserves an explicitly configured host', async () => {
  const env = {
    HOST: '127.0.0.1',
    PORT: '4567',
  }
  let actualOptions: unknown = undefined

  const runApp = async (_appFnOrArgv: unknown, additionalOptions?: { env?: NodeJS.ProcessEnv }): Promise<void> => {
    actualOptions = additionalOptions
  }

  await Main.main(runApp, env)

  expect(actualOptions).toEqual({
    env,
  })
})
