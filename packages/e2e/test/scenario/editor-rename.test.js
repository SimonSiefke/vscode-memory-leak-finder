import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-rename");
});

afterAll(async () => {
  await runner.kill();
});

// TODO test is failing in ci: https://github.com/SimonSiefke/vscode-memory-leak-finder/runs/7427497804?check_suite_focus=true
//  message: 'expect(received).toHaveCSS(expected)\\n' +\n" +
// "      '\\n' +\n" +
// "      'Expected pattern: /(53px|58px)/\\n' +\n" +
// `      'Received string:  "66px"\\n' +\n` +
test.skip("editor-rename", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
