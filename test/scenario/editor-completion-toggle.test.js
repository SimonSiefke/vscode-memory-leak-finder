import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-completion-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test.skip("editor-completion-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
