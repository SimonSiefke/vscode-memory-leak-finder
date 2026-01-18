import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as Indent from '../Indent/Indent.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

export const getTestsUnexpectedErrorMessage = ({
  stack,
  codeFrame,
  type,
  message,
}: {
  stack?: string
  type?: string
  message?: string
  codeFrame?: string
}) => {
  const formattedStack = FormatStack.formatStack(stack || '', '')
  return `${TestPrefix.UnexpectedError}

      ${type}: ${message}

${Indent.indent(codeFrame || '')}

${formattedStack}

`
}
