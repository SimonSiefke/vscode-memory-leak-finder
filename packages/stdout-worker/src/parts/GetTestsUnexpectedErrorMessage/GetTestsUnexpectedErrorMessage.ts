import * as FormatStack from '../FormatStack/FormatStack.ts'
import * as Indent from '../Indent/Indent.ts'
import * as TestPrefix from '../TestPrefix/TestPrefix.ts'

<<<<<<< HEAD
export const getTestsUnexpectedErrorMessage = (error: { stack?: string; type?: string; message?: string; codeFrame?: string }) => {
  const formattedStack = FormatStack.formatStack(error.stack || '', '')
=======
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
>>>>>>> origin/main
  return `${TestPrefix.UnexpectedError}

      ${type}: ${message}

<<<<<<< HEAD
${Indent.indent(error.codeFrame || '')}
=======
${Indent.indent(codeFrame || '')}
>>>>>>> origin/main

${formattedStack}

`
}
