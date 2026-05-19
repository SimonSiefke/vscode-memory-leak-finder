import * as AllowedCommandFlags from '../AllowedCommandFlags/AllowedCommandFlags.ts'

export type ParsedCommandFlags = {
  readonly inspectExtensions: boolean
  readonly inspectPtyHost: boolean
  readonly inspectSharedProcess: boolean
  readonly measure: string
  readonly measureNode: boolean
  readonly only: string
  readonly processRootStrategy?: string
  readonly restartBetween: boolean
  readonly runSkippedTestsAnyway: boolean
  readonly runs?: number
}

export type ParsedBotComment = {
  readonly cliArgs: readonly string[]
  readonly command: 'run'
  readonly flags: ParsedCommandFlags
  readonly mention: string
}

type ParseBotCommentIgnore = {
  readonly type: 'ignore'
}

type ParseBotCommentError = {
  readonly type: 'error'
  readonly message: string
}

type ParseBotCommentSuccess = {
  readonly type: 'success'
  readonly value: ParsedBotComment
}

export type ParseBotCommentResult = ParseBotCommentIgnore | ParseBotCommentError | ParseBotCommentSuccess

const createSyntaxError = (reason: string): ParseBotCommentError => {
  return {
    type: 'error',
    message: `Invalid command syntax. ${reason}. Supported flags: ${AllowedCommandFlags.supportedFlagsMessage}.`,
  }
}

const tokenize = (body: string): readonly string[] => {
  return body.trim().split(/\s+/).filter(Boolean)
}

export const parseBotComment = (body: string): ParseBotCommentResult => {
  const tokens = tokenize(body)
  if (tokens.length === 0) {
    return {
      type: 'ignore',
    }
  }
  const mention = tokens[0]
  if (!AllowedCommandFlags.mentionAliases.includes(mention as (typeof AllowedCommandFlags.mentionAliases)[number])) {
    return {
      type: 'ignore',
    }
  }
  if (tokens[1] !== 'run') {
    return createSyntaxError('Expected "run" after the bot mention')
  }

  const cliArgs: string[] = []
  let inspectExtensions = false
  let inspectPtyHost = false
  let inspectSharedProcess = false
  let measure = ''
  let measureNode = false
  let only = ''
  let restartBetween = false
  let runSkippedTestsAnyway = false
  let runs: number | undefined
  let processRootStrategy: string | undefined

  for (let i = 2; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token.startsWith('--')) {
      return createSyntaxError(`Unexpected token "${token}"`)
    }

    if (AllowedCommandFlags.isBooleanFlag(token)) {
      cliArgs.push(token)
      switch (token) {
        case '--inspect-extensions':
          inspectExtensions = true
          break
        case '--inspect-shared-process':
          inspectSharedProcess = true
          break
        case '--inspect-ptyhost':
          inspectPtyHost = true
          break
        case '--measure-node':
          measureNode = true
          break
        case '--restart-between':
          restartBetween = true
          break
        case '--run-skipped-tests-anyway':
          runSkippedTestsAnyway = true
          break
      }
      continue
    }

    if (!AllowedCommandFlags.isValuedFlag(token)) {
      return createSyntaxError(`Unknown flag "${token}"`)
    }

    const value = tokens[i + 1]
    if (!value || value.startsWith('--')) {
      return createSyntaxError(`Missing value for flag "${token}"`)
    }
    cliArgs.push(token, value)
    i += 1

    switch (token) {
      case '--measure':
        measure = value
        break
      case '--only':
        only = value
        break
      case '--runs': {
        const parsedRuns = Number.parseInt(value, 10)
        if (!Number.isInteger(parsedRuns) || parsedRuns < 1) {
          return createSyntaxError('Expected "--runs" to be a positive integer')
        }
        runs = parsedRuns
        break
      }
      case '--process-root-strategy':
        if (value !== 'launch-pid' && value !== 'ssh-remote-server') {
          return createSyntaxError('Expected "--process-root-strategy" to be one of: launch-pid, ssh-remote-server')
        }
        processRootStrategy = value
        break
    }
  }

  if (!measure) {
    return createSyntaxError('Missing required flag "--measure"')
  }

  if (!only) {
    return createSyntaxError('Missing required flag "--only"')
  }

  const flags: ParsedCommandFlags = {
    inspectExtensions,
    inspectPtyHost,
    inspectSharedProcess,
    measure,
    measureNode,
    only,
    restartBetween,
    runSkippedTestsAnyway,
    ...(typeof runs === 'number' ? { runs } : {}),
    ...(processRootStrategy ? { processRootStrategy } : {}),
  }

  return {
    type: 'success',
    value: {
      cliArgs,
      command: 'run',
      flags,
      mention,
    },
  }
}
