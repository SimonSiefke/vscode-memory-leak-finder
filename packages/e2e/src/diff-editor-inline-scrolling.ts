import type { TestContext } from '../types.ts'

export const skip = 1

// These types and functions are used in the generated TypeScript test file strings
export interface MockTestContext {
  proxy: {
    write: (data: string) => Promise<void>
  }
  page: unknown
}

export const getLinesAsArray = (_count: number): string[] => {
  return Array(_count).fill('')
}

export const pollFor = async (_page: unknown, _getter: () => string[], _expected: string[]): Promise<void> => {
  // Mock implementation
}

const generateTypeScriptTestFile = (): string => {
  const lines: string[] = []

  // Add imports and setup
  lines.push("import { test, expect } from '@jest/globals'")
  lines.push("import type { MockTestContext } from './types'")
  lines.push('')
  lines.push("test.describe('InputHandler Integration Tests', () => {")
  lines.push("  test.describe('CSI', () => {")
  lines.push("    test.describe('CSI ? Pm h - DECSET: Private Mode Set', () => {")
  lines.push("      test('CSI Ps d - VPA: Line Position Absolute [row] (default = [1,column])', async () => {")
  lines.push('        const ctx = {} as MockTestContext')
  lines.push("        await ctx.proxy.write('\\x1b[2d')")
  lines.push("        await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', ''])")
  lines.push('      })')
  lines.push('')
  lines.push("      test('CSI Ps e - VPR: Line Position Relative (default = 1)', async () => {")
  lines.push('        const ctx = {} as MockTestContext')
  lines.push("        await ctx.proxy.write('\\x1b[2e')")
  lines.push("        await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', ''])")
  lines.push('      })')
  lines.push('')
  lines.push("      test('CSI Ps; Ps f - HVP: Horizontal and Vertical Position [row;column] (default = [1,1])', async () => {")
  lines.push('        const ctx = {} as MockTestContext')
  lines.push("        await ctx.proxy.write('\\x1b[3;3f')")
  lines.push("        await pollFor(ctx.page, () => getLinesAsArray(3), ['aoo', '', ''])")
  lines.push('      })')
  lines.push('')
  lines.push("      test('CSI Ps g - TBC: Tab Clear (default = 0)', async () => {")
  lines.push('        const ctx = {} as MockTestContext')
  lines.push("        await ctx.proxy.write('\\x1b[9G\\x1b[g\\x1b[1G\\t')")
  lines.push("        await pollFor(ctx.page, () => getLinesAsArray(1), ['.........'])")
  lines.push("        await ctx.proxy.write('\\x1b[3g\\t')")
  lines.push("        await pollFor(ctx.page, () => getLinesAsArray(1), ['         '])")
  lines.push('      })')
  lines.push('    })')
  lines.push('')

  // Add more test blocks to create scrolling
  for (let i = 0; i < 20; i++) {
    lines.push(`    test.describe('Test Block ${i + 1}', () => {`)
    lines.push(`      test('Test case ${i + 1}a', async () => {`)
    lines.push(`        const ctx = {} as MockTestContext`)
    lines.push(`        await ctx.proxy.write('\\x1b[${i + 1}d')`)
    lines.push(`        await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', ''])`)
    lines.push(`      })`)
    lines.push('')
    lines.push(`      test.skip('Skipped test ${i + 1}', async () => {`)
    lines.push(`        const ctx = {} as MockTestContext`)
    lines.push(`        await ctx.proxy.write('\\x1b[${i + 1}e')`)
    lines.push(`        await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', ''])`)
    lines.push(`      })`)
    lines.push('')
    lines.push(`      test('Test case ${i + 1}b', async () => {`)
    lines.push(`        const ctx = {} as MockTestContext`)
    lines.push(`        await ctx.proxy.write('\\x1b[${i + 1};${i + 1}f')`)
    lines.push(`        await pollFor(ctx.page, () => getLinesAsArray(3), ['aoo', '', ''])`)
    lines.push(`      })`)
    lines.push('    })')
    lines.push('')
  }

  lines.push('  })')
  lines.push('})')

  return lines.join('\n')
}

export const setup = async ({ DiffEditor, Editor, Explorer, Workspace, SideBar, QuickPick }: TestContext): Promise<void> => {
  const originalContent = generateTypeScriptTestFile()
  const lines = originalContent.split('\n')

  // Create modified version with character-level and line-level changes
  const modifiedLines = lines.map((line, i) => {
    // Full line changes (green background) - modify test declarations
    if (line.includes("test('CSI Ps d - VPA")) {
      return "      test('CSI Ps d - VPA: Line Position Absolute [row] (default = [1,column])', async () => {"
    }
    if (line.includes("test('CSI Ps e - VPR")) {
      return "      test('CSI Pse VPR: Line Position Relative (default = 1)', async () => {"
    }
    if (line.includes("test('CSI Ps; Ps f - HVP")) {
      return "      test('CSI Ps; Ps f - HVP: Horizontal and Vertical Position [row;column] (default = [1,1])', async () => {"
    }
    if (line.includes("test('CSI Ps g - TBC")) {
      return "      test('CSI Psg TBC: Tab Clear (default = 0)', async () => {"
    }

    // Character-level changes (lighter green highlight) - add 'b' or 'a' to strings
    if (line.includes("await ctx.proxy.write('\\x1b[2d')") && !line.includes(' b')) {
      return "        await ctx.proxy.write('\\x1b[2d b')"
    }
    if (
      line.includes("await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', ''])") &&
      i > 0 &&
      lines[i - 1].includes("await ctx.proxy.write('\\x1b[2d")
    ) {
      return "        await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', 'b'])"
    }
    if (line.includes("await ctx.proxy.write('\\x1b[2e')") && !line.includes("b'")) {
      return "        await ctx.proxy.write('\\x1b[2eb')"
    }
    if (
      line.includes("await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', ''])") &&
      i > 0 &&
      lines[i - 1].includes("await ctx.proxy.write('\\x1b[2e")
    ) {
      return "        await pollFor(ctx.page, () => getLinesAsArray(4), ['', 'a', '', 'b'])"
    }
    if (line.includes("await ctx.proxy.write('\\x1b[3;3f')") && !line.includes("b'")) {
      return "        await ctx.proxy.write('\\x1b[3;3fb')"
    }
    if (
      line.includes("await pollFor(ctx.page, () => getLinesAsArray(3), ['aoo', '', ''])") &&
      i > 0 &&
      lines[i - 1].includes("await ctx.proxy.write('\\x1b[3;3f")
    ) {
      return "        await pollFor(ctx.page, () => getLinesAsArray(3), ['aoo', '', 'b'])"
    }
    if (line.includes("await ctx.proxy.write('\\x1b[9G\\x1b[g\\x1b[1G\\t')") && !line.includes("a'")) {
      return "        await ctx.proxy.write('\\x1b[9G\\x1b[g\\x1b[1G\\ta')"
    }
    if (
      line.includes("await pollFor(ctx.page, () => getLinesAsArray(1), ['.........'])") &&
      i > 0 &&
      lines[i - 1].includes("await ctx.proxy.write('\\x1b[9G\\x1b[g\\x1b[1G\\t")
    ) {
      return "        await pollFor(ctx.page, () => getLinesAsArray(1), ['.........a'])"
    }
    if (line.includes("await ctx.proxy.write('\\x1b[3g\\t')") && !line.includes("a'")) {
      return "        await ctx.proxy.write('\\x1b[3g\\ta')"
    }
    if (
      line.includes("await pollFor(ctx.page, () => getLinesAsArray(1), ['         '])") &&
      i > 0 &&
      lines[i - 1].includes("await ctx.proxy.write('\\x1b[3g\\t")
    ) {
      return "        await pollFor(ctx.page, () => getLinesAsArray(1), ['         a'])"
    }

    return line
  })

  const modifiedContent = modifiedLines.join('\n')

  await Workspace.setFiles([
    {
      content: originalContent,
      name: 'InputHandler.test.ts',
    },
    {
      content: modifiedContent,
      name: 'InputHandler.test.modified.ts',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('InputHandler.test.ts')
  await Explorer.shouldHaveItem('InputHandler.test.modified.ts')
  await SideBar.hide()

  // @ts-ignore
  await DiffEditor.open({
    file1: 'InputHandler.test.ts',
    file1Content: '',
    file2: 'InputHandler.test.modified.ts',
    file2Content: '',
  })
  await QuickPick.executeCommand('Compare: Toggle Inline View')
}

export const run = async ({ DiffEditor }: TestContext): Promise<void> => {
  await DiffEditor.scrollDownInline()
  await DiffEditor.scrollDownInline()
  await DiffEditor.scrollUpInline()
  await DiffEditor.scrollUpInline()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
