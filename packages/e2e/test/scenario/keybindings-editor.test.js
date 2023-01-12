import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("keybindings-editor");
});

afterAll(async () => {
  await runner.kill();
});

test("keybindings-editor", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
