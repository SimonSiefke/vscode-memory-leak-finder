import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-open");
});

afterAll(async () => {
  await runner.kill();
});

// TODO open editor might have memory leak
test.skip("editor-open", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
