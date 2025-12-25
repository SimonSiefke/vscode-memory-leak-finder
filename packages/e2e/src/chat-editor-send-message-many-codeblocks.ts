import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ ChatEditor, Editor, Electron, Extensions }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  // @ts-ignore
  await Extensions.install({
    id: 'github copilot chat',
    name: 'GitHub Copilot Chat',
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  const codeBlocks = [
    { lang: 'javascript', code: 'const x = 1;\nconsole.log(x);' },
    { lang: 'typescript', code: 'interface User {\n  name: string;\n  age: number;\n}' },
    { lang: 'python', code: 'def hello():\n    print("Hello, World!")' },
    {
      lang: 'java',
      code: 'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}',
    },
    { lang: 'cpp', code: '#include <iostream>\nint main() {\n    std::cout << "Hello";\n}' },
    { lang: 'c', code: '#include <stdio.h>\nint main() {\n    printf("Hello");\n}' },
    { lang: 'csharp', code: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello");\n    }\n}' },
    { lang: 'go', code: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello")\n}' },
    { lang: 'rust', code: 'fn main() {\n    println!("Hello");\n}' },
    { lang: 'ruby', code: 'def hello\n  puts "Hello"\nend' },
    { lang: 'php', code: '<?php\necho "Hello";\n?>' },
    { lang: 'swift', code: 'import Foundation\nprint("Hello")' },
    { lang: 'kotlin', code: 'fun main() {\n    println("Hello")\n}' },
    { lang: 'scala', code: 'object Hello {\n  def main(args: Array[String]) {\n    println("Hello")\n  }\n}' },
    { lang: 'r', code: 'print("Hello")' },
    { lang: 'matlab', code: 'disp("Hello");' },
    { lang: 'perl', code: 'print "Hello\\n";' },
    { lang: 'lua', code: 'print("Hello")' },
    { lang: 'haskell', code: 'main = putStrLn "Hello"' },
    { lang: 'clojure', code: '(println "Hello")' },
    { lang: 'elixir', code: 'IO.puts "Hello"' },
    { lang: 'erlang', code: 'io:format("Hello~n").' },
    { lang: 'ocaml', code: 'print_endline "Hello";;' },
    { lang: 'fsharp', code: 'printfn "Hello"' },
    { lang: 'dart', code: 'void main() {\n  print("Hello");\n}' },
    { lang: 'd', code: 'import std.stdio;\nvoid main() {\n    writeln("Hello");\n}' },
    { lang: 'nim', code: 'echo "Hello"' },
    { lang: 'crystal', code: 'puts "Hello"' },
    { lang: 'zig', code: 'const std = @import("std");\npub fn main() void {\n    std.debug.print("Hello\\n", .{});\n}' },
    { lang: 'v', code: 'fn main() {\n    println("Hello")\n}' },
    { lang: 'julia', code: 'println("Hello")' },
    { lang: 'fortran', code: 'program hello\n    print *, "Hello"\nend program hello' },
    { lang: 'cobol', code: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. HELLO.\nPROCEDURE DIVISION.\n    DISPLAY "Hello".' },
    { lang: 'pascal', code: 'program Hello;\nbegin\n  writeln("Hello");\nend.' },
    { lang: 'ada', code: 'with Ada.Text_IO;\nprocedure Hello is\nbegin\n    Ada.Text_IO.Put_Line("Hello");\nend Hello;' },
    { lang: 'prolog', code: 'main :- write("Hello"), nl.' },
    { lang: 'lisp', code: '(format t "Hello~%")' },
    { lang: 'scheme', code: '(display "Hello")\n(newline)' },
    { lang: 'bash', code: '#!/bin/bash\necho "Hello"' },
    { lang: 'powershell', code: 'Write-Host "Hello"' },
  ]

  const message = `Please analyze these code blocks:\n\n${codeBlocks.map((block) => `\`\`\`${block.lang}\n${block.code}\n\`\`\``).join('\n\n')}`

  await ChatEditor.sendMessage({
    message,
    verify: true,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
