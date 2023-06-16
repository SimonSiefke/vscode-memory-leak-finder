import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("extensions-suggest-toggle");
});

afterAll(async () => {
  await runner.kill();
});

// TODO test is flaky https://github.com/SimonSiefke/vscode-memory-leak-finder/runs/6406254381?check_suite_focus=true
// probably need to wait until extensions are loaded

test("extensions-suggest-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
