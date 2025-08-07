import chalk from 'chalk'
import * as CliKeys from '../CliKeys/CliKeys.js'

const patternModeUsage = chalk.bold('Pattern Mode Usage')
const press = chalk.dim('\u203A Press')
const toExitPatternMode = chalk.dim('to exit pattern mode.')
const toFilterByARegexPattern = chalk.dim(`to filter by a regex pattern.`)
const pattern = chalk.dim(' pattern \u203A')

export const print = () => {
  return `
${patternModeUsage}
 ${press} ${CliKeys.Escape} ${toExitPatternMode}
 ${press} ${CliKeys.Enter} ${toFilterByARegexPattern}

${pattern} `
}
