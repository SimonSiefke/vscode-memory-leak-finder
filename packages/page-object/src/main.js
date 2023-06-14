import * as Parts from "./parts/Parts/Parts.js";

export const create = ({ page, expect, VError }) => {
  const api = Object.create(null);
  for (const [key, value] of Object.entries(Parts)) {
    api[key] = value.create({ page, expect, VError });
  }
  return api;
};
