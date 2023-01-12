import VError from "verror";

export const importScript = async (path) => {
  try {
    return await import(path);
  } catch (error) {
    throw new VError(error, `Failed to import ${path}`);
  }
};
