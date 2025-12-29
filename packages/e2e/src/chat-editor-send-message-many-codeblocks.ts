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
    { code: 'const x = 1;\nconsole.log(x);', lang: 'javascript' },
    { code: 'interface User {\n  name: string;\n  age: number;\n}', lang: 'typescript' },
    { code: 'def hello():\n    print("Hello, World!")', lang: 'python' },
    {
      code: 'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello");\n    }\n}',
      lang: 'java',
    },
    { code: '#include <iostream>\nint main() {\n    std::cout << "Hello";\n}', lang: 'cpp' },
    { code: '#include <stdio.h>\nint main() {\n    printf("Hello");\n}', lang: 'c' },
    { code: 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello");\n    }\n}', lang: 'csharp' },
    { code: 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello")\n}', lang: 'go' },
    { code: 'fn main() {\n    println!("Hello");\n}', lang: 'rust' },
    { code: 'def hello\n  puts "Hello"\nend', lang: 'ruby' },
    { code: '<?php\necho "Hello";\n?>', lang: 'php' },
    { code: 'import Foundation\nprint("Hello")', lang: 'swift' },
    { code: 'fun main() {\n    println("Hello")\n}', lang: 'kotlin' },
    { code: 'object Hello {\n  def main(args: Array[String]) {\n    println("Hello")\n  }\n}', lang: 'scala' },
    { code: 'print("Hello")', lang: 'r' },
    { code: 'disp("Hello");', lang: 'matlab' },
    { code: 'print "Hello\\n";', lang: 'perl' },
    { code: 'print("Hello")', lang: 'lua' },
    { code: 'main = putStrLn "Hello"', lang: 'haskell' },
    { code: '(println "Hello")', lang: 'clojure' },
    { code: 'IO.puts "Hello"', lang: 'elixir' },
    { code: 'io:format("Hello~n").', lang: 'erlang' },
    { code: 'print_endline "Hello";;', lang: 'ocaml' },
    { code: 'printfn "Hello"', lang: 'fsharp' },
    { code: 'void main() {\n  print("Hello");\n}', lang: 'dart' },
    { code: 'import std.stdio;\nvoid main() {\n    writeln("Hello");\n}', lang: 'd' },
    { code: 'echo "Hello"', lang: 'nim' },
    { code: 'puts "Hello"', lang: 'crystal' },
    { code: 'const std = @import("std");\npub fn main() void {\n    std.debug.print("Hello\\n", .{});\n}', lang: 'zig' },
    { code: 'fn main() {\n    println("Hello")\n}', lang: 'v' },
    { code: 'println("Hello")', lang: 'julia' },
    { code: 'program hello\n    print *, "Hello"\nend program hello', lang: 'fortran' },
    { code: 'IDENTIFICATION DIVISION.\nPROGRAM-ID. HELLO.\nPROCEDURE DIVISION.\n    DISPLAY "Hello".', lang: 'cobol' },
    { code: 'program Hello;\nbegin\n  writeln("Hello");\nend.', lang: 'pascal' },
    { code: 'with Ada.Text_IO;\nprocedure Hello is\nbegin\n    Ada.Text_IO.Put_Line("Hello");\nend Hello;', lang: 'ada' },
    { code: 'main :- write("Hello"), nl.', lang: 'prolog' },
    { code: '(format t "Hello~%")', lang: 'lisp' },
    { code: '(display "Hello")\n(newline)', lang: 'scheme' },
    { code: '#!/bin/bash\necho "Hello"', lang: 'bash' },
    { code: 'Write-Host "Hello"', lang: 'powershell' },
  ]

  const message = `Please analyze these code blocks:\n\n${codeBlocks.map((block) => `\`\`\`${block.lang}\n${block.code}\n\`\`\``).join('\n\n')}. Okay`

  await ChatEditor.sendMessage({
    message,
    verify: true,
    viewLinesText: /Okay/,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
