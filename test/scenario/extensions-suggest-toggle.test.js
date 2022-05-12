import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("extensions-suggest-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("extensions-suggest-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
