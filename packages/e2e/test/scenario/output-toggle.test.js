import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("output-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("output-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
