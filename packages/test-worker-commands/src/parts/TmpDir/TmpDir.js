import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const create = () => {
  return mkdtemp(join(tmpdir(), "foo-"));
};
