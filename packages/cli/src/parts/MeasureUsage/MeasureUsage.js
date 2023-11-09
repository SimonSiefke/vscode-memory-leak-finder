import chalk from 'chalk'

const patternModeUsage = chalk.bold('Measure Mode Usage')
const press = chalk.dim('\u203A Press')
const toExitMeasureMode = chalk.dim('to exit measure mode.')
const toUseThisMeasure = chalk.dim(`to use this measure.`)
const measure = chalk.dim(' measure \u203A')

export const print = () => {
  return `
${patternModeUsage}
 ${press} Esc ${toExitMeasureMode}
 ${press} Enter ${toUseThisMeasure}

${measure} `
}
