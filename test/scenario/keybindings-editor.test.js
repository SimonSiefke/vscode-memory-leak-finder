import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("keybindings-editor");
});

afterAll(async () => {
  await runner.kill();
});

// TODO test is flaky https://github.com/SimonSiefke/vscode-memory-leak-finder/runs/6405988542?check_suite_focus=true
test.skip("keybindings-editor", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
