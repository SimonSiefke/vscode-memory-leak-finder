import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("search");
});

afterAll(async () => {
  await runner.kill();
});

test("search", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
