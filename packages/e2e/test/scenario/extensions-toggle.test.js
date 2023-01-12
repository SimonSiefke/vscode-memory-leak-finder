import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("extensions-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("extensions-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
