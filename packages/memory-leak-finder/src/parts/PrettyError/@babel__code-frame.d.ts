declare module '@babel/code-frame' {
  export function codeFrameColumns(
    rawLines: string,
    location: { start: { line: number; column: number } },
    options?: { highlightCode?: boolean; forceColor?: boolean }
  ): string
}
