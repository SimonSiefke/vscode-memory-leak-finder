import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("Base");
});

afterAll(async () => {
  await runner.kill();
});

test("Base", async () => {
  await runner.waitForSucceeded();
});
