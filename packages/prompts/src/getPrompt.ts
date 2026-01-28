export const getPrompt = ({
  content,
  localVscodePath,
  only,
  runs,
  measure,
  ourPath,
}: {
  content: string
  localVscodePath: string
  only: string
  measure: string
  runs: number
  ourPath: string
}): string => {
  const prompt = `Hello,
You are now an agent to find and fix memory leaks. please take a look at the following memory leak result data:

\`\`\`json
${content}
\`\`\`

There should be stack traces of the memory leak there. It shows where the memory leak occurs and what kind it is.

Sometimes there can also be not so useful data included, like event listeners with count 1 or 2. You can ignore those.

But the ones with the highest count can indicate a memory leak.


You can also find a local vscode repository at ${localVscodePath}. There you can read the files and match them with the stack traces.


Now your goal is to fix the memory leaks.

Here are some tips:

1. Event listener memory leaks: Sometimes the code misses adds event listeners and forgets to remove them from the dom
2. Disposables leaks: Sometimes event listeners are registered like Dom.addDisposableListener, which returns a disposable, but the returned disposable is not registered


Once you found a possible cause of the memory leak, you can suggest some edits to the code to fix the memory leak.

Again, the local vscode repository is located at ${localVscodePath}.


Also keep in mind these rules:

1. Never ever run a full VSCode build. It crashes my comuter.
2. Never ever run full tsc in the VSCode folder. It crashes my computer.
3. Never ever run the VSCode compile script. It crashes my computer.
4. Never ever run the VSCode build task. It crashes my computer.
5. Never ever run tests. It crashes my computer.
6. Never ever run hygiene. It crashes my computer.
7. Never ever run tests. It crashes my computer.
8. Never ever run hygiene. It crashes my computer.
9. Never ever run tests. It crashes my computer.
10. Never run npx tsc. It crashes my computer.
10. Don't crash my computer.


Again, to be very clear,
- never write "Let me start the build task"
- never run the task "VS Code - Build"

Additionally there are some stylistic rules:
1. Don't use the \`any\` type
2. Don't use the \`as any\` annotation
3. Don't use ts-ignore
4. Don't add any comment
5. Don't remove any comment
6. Don't modify any comment
7. Don't modify the type signature of any other types or functions when not needed. Only change them when necessary



Additional information:
- You can compile vscode by running \` npx gulp transpile-client-esbuild\`
- You can run the measure by running \` xvfb-run -a node packages/cli/bin/test.js  --run-skipped-tests-anyway    --only ${only}    --runs ${runs} --measure ${measure} --check-leaks --measure-after  --enable-extensions --vscode-path "${localVscodePath}/scripts/code.sh" --measure-node\` in the vscode-memory-leak-finder repository at ${ourPath}
- The measure results are in .vscode-memory-leak-finder-results/node/${measure}/<testName>.json

`

  return prompt
}
