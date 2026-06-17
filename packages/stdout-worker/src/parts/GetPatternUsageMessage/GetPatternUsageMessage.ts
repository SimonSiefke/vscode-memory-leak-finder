import chalk from 'chalk'

const patternModeUsage = chalk.bold('Pattern Mode Usage')
const press = chalk.dim('\u{203A} Press')
const toExitPatternMode = chalk.dim('to exit pattern mode.')
const toFilterByARegexPattern = chalk.dim(`to filter by a regex pattern.`)
const pattern = chalk.dim(' pattern \u{203A}')

export const getPatternUsageMessage = (): string => {
  return `
${patternModeUsage}
 ${press} Esc ${toExitPatternMode}
 ${press} Enter ${toFilterByARegexPattern}

${pattern} `
}
