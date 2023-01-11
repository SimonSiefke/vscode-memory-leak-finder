import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-split");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-split", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
