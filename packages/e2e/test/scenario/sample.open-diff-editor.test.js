import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.open-diff-editor");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.open-diff-editor", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
