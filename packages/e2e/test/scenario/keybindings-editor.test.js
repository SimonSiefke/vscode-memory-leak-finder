import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("keybindings-editor");
});

afterAll(async () => {
  await runner.kill();
});

// TODO report keybindings editor memory leak to vscode 1.79.0
test("keybindings-editor", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener increase: 1435 -> 1439`)
  );
});
