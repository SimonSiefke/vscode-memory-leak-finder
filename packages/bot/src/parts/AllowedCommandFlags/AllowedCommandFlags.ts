export const mentionAliases = [
  '@vscode-memory-leak-finder',
  '@vscode-memory-leak-finder-bot',
  '@vs-code-memory-leak-finder-bot'

] as const

export const booleanFlags = [
  '--inspect-extensions',
  '--inspect-shared-process',
  '--inspect-ptyhost',
  '--measure-node',
  '--restart-between',
  '--run-skipped-tests-anyway',
] as const

export const valuedFlags = ['--measure', '--runs', '--process-root-strategy'] as const

export const supportedFlagsMessage =
  '--measure <value>, --inspect-extensions, --inspect-shared-process, --inspect-ptyhost, --measure-node, --restart-between, --run-skipped-tests-anyway, --runs <value>, --process-root-strategy <value>'

export const isBooleanFlag = (value: string): value is (typeof booleanFlags)[number] => {
  return booleanFlags.includes(value as (typeof booleanFlags)[number])
}

export const isValuedFlag = (value: string): value is (typeof valuedFlags)[number] => {
  return valuedFlags.includes(value as (typeof valuedFlags)[number])
}
