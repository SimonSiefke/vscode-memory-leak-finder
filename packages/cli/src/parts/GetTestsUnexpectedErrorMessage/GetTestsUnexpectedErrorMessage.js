import * as FormatStack from '../FormatStack/FormatStack.js'
import * as Indent from '../Indent/Indent.js'
import * as TestPrefix from '../TestPrefix/TestPrefix.js'

export const getTestsUnexpectedErrorMessage = (error) => {
  const formattedStack = FormatStack.formatStack(error.stack, '')
  return `${TestPrefix.UnexpectedError}

      ${error.type}: ${error.message}

${Indent.indent(error.codeFrame)}

${formattedStack}

`
}
