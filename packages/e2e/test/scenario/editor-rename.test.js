import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-rename");
});

afterAll(async () => {
  await runner.kill();
});

test.skip("editor-rename", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
