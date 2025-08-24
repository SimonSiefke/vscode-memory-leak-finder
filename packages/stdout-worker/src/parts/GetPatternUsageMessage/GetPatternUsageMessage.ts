import { chalk } from '../Chalk/Chalk.ts'

const patternModeUsage = chalk.bold('Pattern Mode Usage')
const press = chalk.dim('\u203A Press')
const toExitPatternMode = chalk.dim('to exit pattern mode.')
const toFilterByARegexPattern = chalk.dim(`to filter by a regex pattern.`)
const pattern = chalk.dim(' pattern \u203A')

export const getPatternUsageMessage = (): string => {
  return `
${patternModeUsage}
 ${press} Esc ${toExitPatternMode}
 ${press} Enter ${toFilterByARegexPattern}

${pattern} `
}
