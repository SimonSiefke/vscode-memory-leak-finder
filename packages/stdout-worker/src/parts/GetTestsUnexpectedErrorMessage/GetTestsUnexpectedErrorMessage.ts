import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as Indent from '../Indent/Indent.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getTestsUnexpectedErrorMessage = (error) => {
  const formattedStack = FormatStack.formatStack(error.stack, '')
  return `${TestPrefix.UnexpectedError}

      ${error.type}: ${error.message}

${Indent.indent(error.codeFrame)}

${formattedStack}

`
}
