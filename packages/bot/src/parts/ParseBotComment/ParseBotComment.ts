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
  const flags: ParsedCommandFlags = {
    inspectExtensions: false,
    inspectPtyHost: false,
    inspectSharedProcess: false,
    measure: '',
    measureNode: false,
    only: '',
    restartBetween: false,
    runSkippedTestsAnyway: false,
  }

  for (let i = 2; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token.startsWith('--')) {
      return createSyntaxError(`Unexpected token "${token}"`)
    }

    if (AllowedCommandFlags.isBooleanFlag(token)) {
      cliArgs.push(token)
      switch (token) {
        case '--inspect-extensions':
          flags.inspectExtensions = true
          break
        case '--inspect-shared-process':
          flags.inspectSharedProcess = true
          break
        case '--inspect-ptyhost':
          flags.inspectPtyHost = true
          break
        case '--measure-node':
          flags.measureNode = true
          break
        case '--restart-between':
          flags.restartBetween = true
          break
        case '--run-skipped-tests-anyway':
          flags.runSkippedTestsAnyway = true
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
        flags.measure = value
        break
      case '--only':
        flags.only = value
        break
      case '--runs': {
        const parsedRuns = Number.parseInt(value, 10)
        if (!Number.isInteger(parsedRuns) || parsedRuns < 1) {
          return createSyntaxError('Expected "--runs" to be a positive integer')
        }
        flags.runs = parsedRuns
        break
      }
      case '--process-root-strategy':
        if (value !== 'launch-pid' && value !== 'ssh-remote-server') {
          return createSyntaxError('Expected "--process-root-strategy" to be one of: launch-pid, ssh-remote-server')
        }
        flags.processRootStrategy = value
        break
    }
  }

  if (!flags.measure) {
    return createSyntaxError('Missing required flag "--measure"')
  }

  if (!flags.only) {
    return createSyntaxError('Missing required flag "--only"')
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
