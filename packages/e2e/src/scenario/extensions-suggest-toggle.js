export const setup = async ({ Extensions }) => {
  await Extensions.show();
};

export const run = async ({ Extensions }) => {
  await Extensions.openSuggest();
  await Extensions.closeSuggest();
};
